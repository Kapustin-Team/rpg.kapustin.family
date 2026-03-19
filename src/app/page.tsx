'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useGameStore, type Task, type PipelineStage } from '@/store/gameStore'
import { AGENTS } from '@/data/agents'

// ─── Types ───
interface ActivityEntry {
  id: string
  type: string
  message: string
  timestamp: string
  agentId?: string
  taskId?: string
}

interface VisualPipeline {
  taskId: string
  taskTitle: string
  agentId: string
  agentName: string
  agentEmoji: string
  stages: {
    status: string
    emoji: string
    label: string
    timestamp?: string
    reached: boolean
  }[]
}

// ─── Priority colors ───
const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-gray-600 text-gray-200',
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  done: 'bg-green-500',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const PIPELINE_STAGE_COLORS: Record<string, string> = {
  assigned: 'bg-blue-700 text-blue-200',
  received: 'bg-cyan-700 text-cyan-200',
  started: 'bg-yellow-700 text-yellow-200',
  progress: 'bg-orange-700 text-orange-200',
  completed: 'bg-green-700 text-green-200',
  failed: 'bg-red-700 text-red-200',
}

const PIPELINE_STAGE_LABELS: Record<string, string> = {
  assigned: 'assigned',
  received: 'received',
  started: 'working',
  progress: 'progress',
  completed: 'done',
  failed: 'failed',
}

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  'task-assigned': 'border-l-blue-500',
  'task-received': 'border-l-cyan-500',
  'task-started': 'border-l-yellow-500',
  'task-progress': 'border-l-orange-500',
  'task-completed': 'border-l-green-500',
  'task-failed': 'border-l-red-500',
  'task-status': 'border-l-yellow-500',
  'task-updated': 'border-l-cyan-500',
  'system-log': 'border-l-gray-500',
}

const ACTIVITY_TEXT_COLORS: Record<string, string> = {
  'task-completed': 'text-green-400',
  'task-assigned': 'text-blue-400',
  'task-status': 'text-yellow-400',
  'task-updated': 'text-cyan-400',
  'task-failed': 'text-red-400',
  'system-log': 'text-gray-500',
}

// ─── Helpers ───
function formatTimeWithSeconds(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '--:--:--'
  }
}

function getPipelineStep(activity: ActivityEntry): string | null {
  if (activity.type === 'task-assigned') return '[1/5]'
  if (activity.type === 'task-status' || activity.type === 'task-received' || activity.type === 'task-started' || activity.type === 'task-progress') {
    const msg = activity.message.toLowerCase()
    if (msg.includes('received')) return '[2/5]'
    if (msg.includes('started')) return '[3/5]'
    if (msg.includes('progress')) return '[4/5]'
    if (msg.includes('completed') || msg.includes('complete')) return '[5/5]'
    if (msg.includes('failed')) return '[✗]'
  }
  if (activity.type === 'task-completed') return '[5/5]'
  return null
}

function getAgentInfo(agentId?: string) {
  if (!agentId) return null
  return AGENTS.find(a => a.id === agentId)
}

// ─── Resources Bar ───
function ResourcesBar() {
  const resources = useGameStore(s => s.resources)
  return (
    <div className="flex flex-wrap gap-3">
      {resources.map(r => {
        const pct = Math.min(100, (r.amount / r.maxCapacity) * 100)
        return (
          <div key={r.type} className="flex items-center gap-1.5 text-sm">
            <span>{r.icon}</span>
            <div className="w-20">
              <div className="flex justify-between text-xs text-gray-400">
                <span>{r.label}</span>
                <span>{Math.floor(r.amount)}</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: r.color }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Character Level ───
function CharacterLevel() {
  const char = useGameStore(s => s.character)
  const xpPct = Math.min(100, (char.xp / char.xpToNextLevel) * 100)
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-yellow-400 font-bold text-lg">⚔️ Lv.{char.level}</span>
        <div className="w-24">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{char.xp}/{char.xpToNextLevel} XP</div>
        </div>
      </div>
      <span className="text-gray-500">🔥 {char.streakDays}d streak</span>
      <span className="text-gray-500">✅ {char.totalTasksCompleted} done</span>
    </div>
  )
}

// ─── SSE Connection indicator ───
function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      connected ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {connected ? 'Live' : 'Offline'}
    </span>
  )
}

// ─── Agent Card ───
function AgentCard({ agent, flashId }: { agent: typeof AGENTS[0]; flashId: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const storeAgent = useGameStore(s => s.agents.find(a => a.id === agent.id))
  const tasks = useGameStore(s => s.tasks)
  const selectedAgentId = useGameStore(s => s.selectedAgentId)
  const setSelectedAgent = useGameStore(s => s.setSelectedAgent)

  const currentTask = storeAgent?.currentTaskId
    ? tasks.find(t => t.id === storeAgent.currentTaskId)
    : null
  const status = storeAgent?.status || 'idle'
  const isSelected = selectedAgentId === agent.id
  const isFlashing = flashId === agent.id

  return (
    <div
      className={`rounded-lg bg-gray-800/80 p-3 cursor-pointer transition-all border border-transparent hover:border-gray-600 ${isSelected ? 'ring-2 ring-yellow-500/50' : ''} ${isFlashing ? 'animate-pulse ring-2 ring-yellow-400/70' : ''}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: agent.color }}
      onClick={() => {
        setSelectedAgent(isSelected ? null : agent.id)
        setExpanded(!expanded)
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{agent.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{agent.name}</div>
          <div className="text-xs text-gray-400">{agent.role}</div>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
          status === 'working' ? 'bg-green-900/60 text-green-400' :
          status === 'done' ? 'bg-blue-900/60 text-blue-400' :
          'bg-gray-700 text-gray-400'
        }`}>
          {status === 'working' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
          {status}
        </span>
      </div>
      {currentTask && (
        <div className="mt-1.5 text-xs text-green-300 truncate pl-7">
          📋 {currentTask.title}
        </div>
      )}
      {expanded && (
        <div className="mt-3 pl-7 space-y-1 text-xs text-gray-400 border-t border-gray-700 pt-2">
          <p>{agent.description}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {agent.specialization.map(s => (
              <span key={s} className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300">{s}</span>
            ))}
          </div>
          <div className="mt-1 text-gray-600 font-mono text-[10px]">{agent.sessionKey}</div>
        </div>
      )}
    </div>
  )
}

// ─── Pipeline Pills ───
function PipelinePills({ stages }: { stages: PipelineStage[] }) {
  if (!stages.length) return null
  const latestByType = new Map<string, PipelineStage>()
  for (const s of stages) latestByType.set(s.stage, s)
  const ordered: PipelineStage['stage'][] = ['assigned', 'received', 'started', 'progress', 'completed', 'failed']
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {ordered.map(stage => {
        const entry = latestByType.get(stage)
        if (!entry) return null
        return (
          <span
            key={stage}
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${PIPELINE_STAGE_COLORS[stage] || 'bg-gray-700 text-gray-300'}`}
            title={entry.message || stage}
          >
            {PIPELINE_STAGE_LABELS[stage] || stage}
          </span>
        )
      })}
    </div>
  )
}

// ─── Pipeline Tracker (Visual) ───
function PipelineTracker({ pipeline }: { pipeline: VisualPipeline }) {
  return (
    <div className="rounded-lg bg-gray-800/60 border border-gray-700/50 p-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">📋</span>
        <span className="font-semibold text-gray-200 truncate">&ldquo;{pipeline.taskTitle}&rdquo;</span>
        <span className="text-gray-500">→</span>
        <span>{pipeline.agentEmoji} {pipeline.agentName}</span>
      </div>
      <div className="space-y-0.5 pl-2">
        {pipeline.stages.map((stage, i) => {
          const isLast = i === pipeline.stages.length - 1
          const connector = isLast ? '└─' : '├─'
          const stageColor = stage.reached
            ? stage.status === 'completed' ? 'text-green-400'
              : stage.status === 'failed' ? 'text-red-400'
              : 'text-yellow-400'
            : 'text-gray-600'

          return (
            <div key={stage.status} className={`flex items-center gap-2 font-mono ${stageColor}`}>
              <span className="text-gray-600">{connector}</span>
              <span>{stage.emoji}</span>
              <span className="w-20">{stage.label}</span>
              <span className="text-gray-600">────</span>
              <span className={stage.reached ? '' : 'text-gray-600'}>
                {stage.reached
                  ? stage.timestamp
                    ? formatTimeWithSeconds(stage.timestamp)
                    : '✅'
                  : '(waiting...)'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Task Card ───
function TaskCard({ task, isFlashing }: { task: Task; isFlashing: boolean }) {
  const agents = useGameStore(s => s.agents)
  const assignTaskToAgent = useGameStore(s => s.assignTaskToAgent)
  const completeTask = useGameStore(s => s.completeTask)
  const xpAnimation = useGameStore(s => s.xpAnimation)
  const clearXpAnimation = useGameStore(s => s.clearXpAnimation)
  const pipelineEntry = useGameStore(s => s.taskPipeline[task.id])
  const [completing, setCompleting] = useState(false)
  const showXp = xpAnimation?.taskId === task.id

  useEffect(() => {
    if (showXp) {
      const t = setTimeout(clearXpAnimation, 2000)
      return () => clearTimeout(t)
    }
  }, [showXp, clearXpAnimation])

  const assignedAgent = task.assignedTo ? agents.find(a => a.id === task.assignedTo) : null

  // Pipeline step count for badge
  const pipelineStepCount = pipelineEntry ? pipelineEntry.stages.length : 0
  const pipelineLabel = pipelineStepCount > 0 ? `[${pipelineStepCount}/5]` : null

  async function handleComplete() {
    if (!assignedAgent || completing) return
    setCompleting(true)
    try {
      if (task.documentId) {
        await fetch(`/api/tasks/${task.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done' }),
        })
      }
      await fetch('/api/notify-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          agentName: assignedAgent.name,
          agentId: assignedAgent.id,
          xpReward: task.xpReward,
        }),
      })
      completeTask(task.id)
    } catch (e) {
      console.error('Complete failed:', e)
    }
    setCompleting(false)
  }

  async function handleAssign(agentId: string) {
    console.log(`[UI] 🎯 Assigning task "${task.title}" to ${agentId}`)
    assignTaskToAgent(agentId, task.id)

    if (task.documentId) {
      console.log(`[UI] 📤 Updating Strapi task ${task.documentId} → in_progress`)
      try {
        const strapiRes = await fetch(`/api/tasks/${task.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        })
        const strapiData = await strapiRes.json()
        console.log(`[UI] 📥 Strapi response:`, strapiData)
      } catch (err) {
        console.error(`[UI] ❌ Strapi update failed:`, err)
      }
    }

    console.log(`[UI] 📤 Calling /api/assign-task...`)
    try {
      const assignRes = await fetch('/api/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: '',
          agentId,
          xpReward: task.xpReward,
          priority: task.priority,
          category: task.rpgCategory,
        }),
      })
      const assignData = await assignRes.json()
      console.log(`[UI] 📥 Assign response:`, JSON.stringify(assignData, null, 2))
    } catch (err) {
      console.error(`[UI] ❌ Assign failed:`, err)
    }
  }

  return (
    <div className={`relative rounded-lg bg-gray-800/80 p-3 border transition-all duration-300 ${task.status === 'done' ? 'opacity-60 border-gray-700/50' : 'border-gray-700/50'} ${isFlashing ? 'ring-2 ring-yellow-400/60 border-yellow-500/40' : ''}`}>
      {showXp && (
        <div className="absolute -top-4 right-4 text-yellow-400 font-bold text-lg animate-bounce z-10">
          +{xpAnimation.amount} XP! ⭐
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-sm">{task.title}</div>
            {pipelineLabel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-mono">
                🔧 {pipelineLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low}`}>
              {task.priority}
            </span>
            <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-white ${STATUS_COLORS[task.status] || STATUS_COLORS.todo}`}>
              {STATUS_LABELS[task.status] || task.status}
            </span>
            {task.rpgCategory && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">
                {task.rpgCategory}
              </span>
            )}
            <span className="text-[10px] text-yellow-500">⭐ {task.xpReward} XP</span>
          </div>
          {pipelineEntry && <PipelinePills stages={pipelineEntry.stages} />}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {task.status !== 'done' ? (
          <>
            {assignedAgent ? (
              <div className="flex items-center gap-1 text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                <span>{assignedAgent.emoji}</span>
                <span>{assignedAgent.name.split(' ')[0]}</span>
              </div>
            ) : (
              <select
                className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-yellow-500"
                value=""
                onChange={(e) => e.target.value && handleAssign(e.target.value)}
              >
                <option value="">Assign agent...</option>
                {AGENTS.map(a => (
                  <option key={a.id} value={a.id}>{a.emoji} {a.name.split(' ')[0]}</option>
                ))}
              </select>
            )}
            {assignedAgent && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="ml-auto text-xs bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
              >
                {completing ? '...' : '✅ Complete'}
              </button>
            )}
          </>
        ) : (
          <div className="text-xs text-green-400">✅ Completed</div>
        )}
      </div>
    </div>
  )
}

// ─── Enhanced Activity Feed ───
function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [activities.length])

  const visibleActivities = showAll ? activities : activities.slice(0, 10)

  return (
    <div className="rounded-lg bg-gray-800/80 border border-gray-700/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-700/50 flex items-center gap-2">
        <span className="text-sm">📡</span>
        <h3 className="text-sm font-semibold text-gray-300">Live Activity</h3>
        <span className="text-xs text-gray-500">({activities.length})</span>
      </div>
      <div
        ref={scrollRef}
        className={`overflow-y-auto p-2 space-y-1 ${showAll ? 'max-h-[600px]' : 'max-h-[420px]'}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {activities.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-4">
            No activity yet — actions will appear here in real-time
          </div>
        ) : (
          visibleActivities.map((a) => {
            const agent = getAgentInfo(a.agentId)
            const textColor = ACTIVITY_TEXT_COLORS[a.type] || 'text-gray-300'
            const borderColor = ACTIVITY_TYPE_COLORS[a.type] || 'border-l-transparent'
            const pipelineStep = getPipelineStep(a)

            // Background color by type
            const bgColor =
              a.type === 'task-completed' ? 'bg-green-900/10' :
              a.type === 'task-failed' || (a.type === 'task-status' && a.message.includes('failed')) ? 'bg-red-900/10' :
              a.type === 'task-status' ? 'bg-yellow-900/5' :
              a.type === 'system-log' ? 'bg-gray-800/40' :
              ''

            return (
              <div
                key={a.id}
                className={`flex items-start gap-2 text-xs py-1.5 px-2 rounded hover:bg-gray-700/30 transition-colors border-l-2 ${borderColor} ${bgColor}`}
              >
                <span className="text-gray-500 font-mono shrink-0 w-[60px]">{formatTimeWithSeconds(a.timestamp)}</span>
                {agent && (
                  <span className="shrink-0" title={agent.name}>{agent.emoji}</span>
                )}
                {pipelineStep && (
                  <span className="text-indigo-400 font-mono shrink-0 text-[10px]">{pipelineStep}</span>
                )}
                <span className={textColor}>{a.message}</span>
              </div>
            )
          })
        )}
      </div>
      {activities.length > 10 && (
        <div className="px-3 py-2 border-t border-gray-700/50">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {showAll ? `Show less ↑` : `Show all ${activities.length} events ↓`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── useSSE Hook ───
function useSSE(
  onActivity: (activity: ActivityEntry) => void,
  onPipelineUpdate: (data: { taskId: string; agentId: string; status: string; taskTitle?: string; agentName?: string }) => void,
) {
  const [connected, setConnected] = useState(false)
  const loadFromStrapi = useGameStore(s => s.loadFromStrapi)
  const onActivityRef = useRef(onActivity)
  const onPipelineRef = useRef(onPipelineUpdate)
  onActivityRef.current = onActivity
  onPipelineRef.current = onPipelineUpdate

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      eventSource = new EventSource('/api/events')

      eventSource.onopen = () => {
        setConnected(true)
      }

      eventSource.onerror = () => {
        setConnected(false)
        eventSource?.close()
        reconnectTimer = setTimeout(connect, 5000)
      }

      eventSource.addEventListener('task-assigned', (e) => {
        try {
          const data = JSON.parse(e.data)
          onActivityRef.current({
            id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'task-assigned',
            message: `📋 Task "${data.taskTitle}" → ${data.agentEmoji || ''} ${data.agentName}`,
            timestamp: data.timestamp || new Date().toISOString(),
            agentId: data.agentId,
          })
          if (data.taskId) {
            const { addPipelineStage } = useGameStore.getState()
            addPipelineStage(data.taskId, 'assigned', `Assigned to ${data.agentName}`)
          }
          // Feed pipeline visual tracker
          onPipelineRef.current({
            taskId: data.taskId || data.agentId,
            agentId: data.agentId,
            status: 'assigned',
            taskTitle: data.taskTitle,
            agentName: data.agentName,
          })
          loadFromStrapi()
        } catch { /* ignore */ }
      })

      eventSource.addEventListener('task-completed', (e) => {
        try {
          const data = JSON.parse(e.data)
          onActivityRef.current({
            id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'task-completed',
            message: `✅ "${data.taskTitle}" completed by ${data.agentName} (+${data.xpReward} XP)`,
            timestamp: data.timestamp || new Date().toISOString(),
            agentId: data.agentId,
          })
          if (data.taskId) {
            const { addPipelineStage } = useGameStore.getState()
            addPipelineStage(data.taskId, 'completed', `Completed by ${data.agentName}`)
          }
          onPipelineRef.current({
            taskId: data.taskId || data.agentId,
            agentId: data.agentId,
            status: 'completed',
            taskTitle: data.taskTitle,
            agentName: data.agentName,
          })
          loadFromStrapi()
        } catch { /* ignore */ }
      })

      eventSource.addEventListener('task-updated', (e) => {
        try {
          const data = JSON.parse(e.data)
          onActivityRef.current({
            id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'task-updated',
            message: `🔄 Task updated → ${data.status || 'modified'}`,
            timestamp: data.timestamp || new Date().toISOString(),
            taskId: data.taskId,
          })
          loadFromStrapi()
        } catch { /* ignore */ }
      })

      // task-status-update from /api/task-status
      eventSource.addEventListener('task-status-update', (e) => {
        try {
          const data = JSON.parse(e.data)
          const emoji = data.emoji || '📌'
          const progressText = data.progress !== undefined ? ` (${data.progress}%)` : ''
          onActivityRef.current({
            id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'task-status',
            message: `${emoji} Task ${data.taskId}: ${data.status}${progressText} — ${data.message || ''}`,
            timestamp: data.timestamp || new Date().toISOString(),
            agentId: data.agentId,
            taskId: data.taskId,
          })
          // Update pipeline stage in store
          if (data.taskId && ['received', 'started', 'progress', 'completed', 'failed'].includes(data.status)) {
            const { addPipelineStage } = useGameStore.getState()
            addPipelineStage(data.taskId, data.status, data.message)
          }
          // Feed visual pipeline
          onPipelineRef.current({
            taskId: data.taskId,
            agentId: data.agentId,
            status: data.status,
          })
        } catch { /* ignore */ }
      })

      // Pipeline stage events
      const pipelineEvents = ['task-received', 'task-started', 'task-progress', 'task-failed'] as const
      for (const eventType of pipelineEvents) {
        eventSource.addEventListener(eventType, (e) => {
          try {
            const data = JSON.parse(e.data)
            const stageMap: Record<string, string> = {
              'task-received': 'received',
              'task-started': 'started',
              'task-progress': 'progress',
              'task-failed': 'failed',
            }
            const stage = stageMap[eventType] || eventType.replace('task-', '')
            const emoji: Record<string, string> = {
              received: '📥', started: '🔨', progress: '⏳', failed: '❌',
            }
            onActivityRef.current({
              id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: eventType,
              message: `${emoji[stage] || '🔔'} [${stage.toUpperCase()}] ${data.message || `Task ${stage}`}`,
              timestamp: data.timestamp || new Date().toISOString(),
              agentId: data.agentId,
              taskId: data.taskId,
            })
            if (data.taskId) {
              const { addPipelineStage } = useGameStore.getState()
              addPipelineStage(data.taskId, stage as 'received' | 'started' | 'progress' | 'failed', data.message)
            }
            onPipelineRef.current({
              taskId: data.taskId,
              agentId: data.agentId,
              status: stage,
            })
            loadFromStrapi()
          } catch { /* ignore */ }
        })
      }

      eventSource.addEventListener('activity', (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.activity) {
            onActivityRef.current(data.activity)
          }
        } catch { /* ignore */ }
      })
    }

    connect()

    return () => {
      eventSource?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [loadFromStrapi])

  return connected
}

// ─── Main Page ───
export default function HomePage() {
  const loadFromStrapi = useGameStore(s => s.loadFromStrapi)
  const isLoaded = useGameStore(s => s.isLoaded)
  const tasks = useGameStore(s => s.tasks)

  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [flashAgentId, setFlashAgentId] = useState<string | null>(null)
  const [flashTaskIds, setFlashTaskIds] = useState<Set<string>>(new Set())
  const [visualPipelines, setVisualPipelines] = useState<Map<string, VisualPipeline>>(new Map())

  // Load initial data
  useEffect(() => {
    loadFromStrapi()
  }, [loadFromStrapi])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      loadFromStrapi()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadFromStrapi])

  // Load persisted events from Strapi on mount
  useEffect(() => {
    console.log('[UI] 📤 Loading persisted events from /api/events-log')
    fetch('/api/events-log?limit=50')
      .then(r => r.json())
      .then(data => {
        if (data.events && Array.isArray(data.events)) {
          console.log(`[UI] ✅ Loaded ${data.events.length} persisted events from Strapi`)
          const mapped: ActivityEntry[] = data.events.map((e: Record<string, unknown>) => {
            const meta = (e.metadata || {}) as Record<string, unknown>
            return {
              id: `strapi-${e.id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: (meta.originalType as string) || 'system-log',
              message: (e.description as string) || (e.title as string) || 'Event',
              timestamp: (e.happenedAt as string) || (e.createdAt as string) || new Date().toISOString(),
              agentId: meta.agentId as string | undefined,
              taskId: meta.taskId as string | undefined,
            }
          })
          setActivities(prev => {
            const combined = [...prev, ...mapped]
            const seen = new Set<string>()
            const unique = combined.filter(a => {
              const key = `${a.type}-${a.message.slice(0, 80)}-${a.timestamp.slice(0, 19)}`
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            return unique.slice(0, 100)
          })
        }
      })
      .catch((err) => {
        console.error('[UI] ❌ Failed to load persisted events:', err)
      })
  }, [])

  // Load in-memory activities
  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(data => {
        if (data.activities) {
          setActivities(prev => {
            const combined = [...data.activities, ...prev]
            const seen = new Set<string>()
            const unique = combined.filter((a: ActivityEntry) => {
              const key = `${a.type}-${a.message.slice(0, 80)}-${a.timestamp.slice(0, 19)}`
              if (seen.has(key)) return false
              seen.add(key)
              return true
            })
            unique.sort((a: ActivityEntry, b: ActivityEntry) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            return unique.slice(0, 100)
          })
        }
      })
      .catch(() => {})
  }, [])

  // Handle new activity from SSE
  const handleActivity = useCallback((activity: ActivityEntry) => {
    setActivities(prev => {
      const next = [activity, ...prev]
      if (next.length > 100) next.length = 100
      return next
    })

    if (activity.agentId) {
      setFlashAgentId(activity.agentId)
      setTimeout(() => setFlashAgentId(null), 2000)
    }

    if (activity.taskId) {
      setFlashTaskIds(prev => new Set(prev).add(activity.taskId!))
      setTimeout(() => {
        setFlashTaskIds(prev => {
          const next = new Set(prev)
          next.delete(activity.taskId!)
          return next
        })
      }, 2000)
    }
  }, [])

  // Handle pipeline status updates
  const handlePipelineUpdate = useCallback((data: { taskId: string; agentId: string; status: string; taskTitle?: string; agentName?: string }) => {
    setVisualPipelines(prev => {
      const next = new Map(prev)
      const key = data.agentId // Use agentId as key since taskId may not always be present

      const STAGE_ORDER = ['assigned', 'received', 'started', 'progress', 'completed']
      const buildStages = () => [
        { status: 'assigned', emoji: '📤', label: 'Assigned', reached: false },
        { status: 'received', emoji: '📨', label: 'Received', reached: false },
        { status: 'started', emoji: '🏃', label: 'Started', reached: false },
        { status: 'progress', emoji: '⏳', label: 'Progress', reached: false },
        { status: 'completed', emoji: '✅', label: 'Completed', reached: false },
      ]

      let pipeline = next.get(key)
      if (!pipeline) {
        const agent = AGENTS.find(a => a.id === data.agentId)
        pipeline = {
          taskId: data.taskId,
          taskTitle: data.taskTitle || `Task ${data.taskId}`,
          agentId: data.agentId,
          agentName: data.agentName || agent?.name || data.agentId,
          agentEmoji: agent?.emoji || '🤖',
          stages: buildStages(),
        }
      }

      // Update title/name if provided
      if (data.taskTitle) pipeline.taskTitle = data.taskTitle
      if (data.agentName) pipeline.agentName = data.agentName

      const stageIdx = STAGE_ORDER.indexOf(data.status)
      if (data.status === 'failed') {
        // Mark up to progress as reached, then replace completed with failed
        for (let i = 0; i < 4; i++) pipeline.stages[i].reached = true
        pipeline.stages[4] = {
          status: 'failed',
          emoji: '❌',
          label: 'Failed',
          reached: true,
          timestamp: new Date().toISOString(),
        }
      } else if (stageIdx >= 0) {
        for (let i = 0; i <= stageIdx; i++) {
          pipeline.stages[i].reached = true
          if (i === stageIdx && !pipeline.stages[i].timestamp) {
            pipeline.stages[i].timestamp = new Date().toISOString()
          }
        }
      }

      next.set(key, { ...pipeline })
      return next
    })
  }, [])

  const connected = useSSE(handleActivity, handlePipelineUpdate)

  const activeTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e8dcc8]">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>
              ⚔️ RPG City Control Panel
            </h1>
            <ConnectionStatus connected={connected} />
          </div>
          <ResourcesBar />
        </div>
      </header>

      {/* Character bar */}
      <div className="border-b border-gray-800/50 px-4 py-2">
        <div className="max-w-7xl mx-auto">
          <CharacterLevel />
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-64">
            <div className="ng-spinner" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left: Agents */}
              <aside className="lg:w-72 shrink-0 space-y-2">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Agents ({AGENTS.length})
                </h2>
                {AGENTS.map(agent => (
                  <AgentCard key={agent.id} agent={agent} flashId={flashAgentId} />
                ))}
              </aside>

              {/* Right: Tasks */}
              <section className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Tasks ({tasks.length})
                  </h2>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>📋 {activeTasks.length} active</span>
                    <span>✅ {doneTasks.length} done</span>
                  </div>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center text-gray-600 py-12">
                    No tasks loaded from Strapi
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeTasks.map(task => (
                      <TaskCard key={task.id} task={task} isFlashing={flashTaskIds.has(task.id)} />
                    ))}
                    {doneTasks.map(task => (
                      <TaskCard key={task.id} task={task} isFlashing={flashTaskIds.has(task.id)} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Pipeline Trackers */}
            {visualPipelines.size > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  🔧 Active Pipelines ({visualPipelines.size})
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[...visualPipelines.values()].map(pipeline => (
                    <PipelineTracker key={pipeline.agentId} pipeline={pipeline} />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom: Activity Feed */}
            <ActivityFeed activities={activities} />
          </div>
        )}
      </main>
    </div>
  )
}
