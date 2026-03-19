'use client'

import { useEffect, useState } from 'react'
import { useGameStore, type Task } from '@/store/gameStore'
import { AGENTS } from '@/data/agents'

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

// ─── Agent Card ───
function AgentCard({ agent }: { agent: typeof AGENTS[0] }) {
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

  return (
    <div
      className={`rounded-lg bg-gray-800/80 p-3 cursor-pointer transition-all border border-transparent hover:border-gray-600 ${isSelected ? 'ring-2 ring-yellow-500/50' : ''}`}
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

// ─── Task Card ───
function TaskCard({ task }: { task: Task }) {
  const agents = useGameStore(s => s.agents)
  const assignTaskToAgent = useGameStore(s => s.assignTaskToAgent)
  const completeTask = useGameStore(s => s.completeTask)
  const xpAnimation = useGameStore(s => s.xpAnimation)
  const clearXpAnimation = useGameStore(s => s.clearXpAnimation)
  const [completing, setCompleting] = useState(false)
  const showXp = xpAnimation?.taskId === task.id

  useEffect(() => {
    if (showXp) {
      const t = setTimeout(clearXpAnimation, 2000)
      return () => clearTimeout(t)
    }
  }, [showXp, clearXpAnimation])

  const assignedAgent = task.assignedTo ? agents.find(a => a.id === task.assignedTo) : null

  async function handleComplete() {
    if (!assignedAgent || completing) return
    setCompleting(true)
    try {
      // Update in Strapi
      if (task.documentId) {
        await fetch(`/api/tasks/${task.documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'done' }),
        })
      }
      // Notify
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

  function handleAssign(agentId: string) {
    assignTaskToAgent(agentId, task.id)
    // Update Strapi
    if (task.documentId) {
      fetch(`/api/tasks/${task.documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      }).catch(() => {})
    }
    // Notify agent about the assignment
    fetch('/api/assign-task', {
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
    }).catch(() => {})
  }

  return (
    <div className={`relative rounded-lg bg-gray-800/80 p-3 border border-gray-700/50 transition-all ${task.status === 'done' ? 'opacity-60' : ''}`}>
      {/* XP Animation */}
      {showXp && (
        <div className="absolute -top-4 right-4 text-yellow-400 font-bold text-lg animate-bounce z-10">
          +{xpAnimation.amount} XP! ⭐
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{task.title}</div>
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

// ─── Main Page ───
export default function HomePage() {
  const loadFromStrapi = useGameStore(s => s.loadFromStrapi)
  const isLoaded = useGameStore(s => s.isLoaded)
  const tasks = useGameStore(s => s.tasks)

  useEffect(() => {
    loadFromStrapi()
  }, [loadFromStrapi])

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
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: Agents */}
            <aside className="lg:w-72 shrink-0 space-y-2">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Agents ({AGENTS.length})
              </h2>
              {AGENTS.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
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
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {doneTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
