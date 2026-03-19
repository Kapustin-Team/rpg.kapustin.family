'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#8b5cf6',
  backend: '#06b6d4',
  devops: '#f97316',
  content: '#ec4899',
  health: '#22c55e',
  research: '#eab308',
  build: '#64748b',
  defense: '#ef4444',
  trade: '#f59e0b',
  exploration: '#14b8a6',
}

const CATEGORY_EMOJI: Record<string, string> = {
  frontend: '🎨',
  backend: '⚙️',
  devops: '🚀',
  content: '📝',
  health: '💚',
  research: '🔬',
  build: '🏗️',
  defense: '🛡️',
  trade: '💰',
  exploration: '🗺️',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export default function TaskPanel() {
  const tasks = useGameStore((s) => s.tasks)
  const agents = useGameStore((s) => s.agents)
  const completeTask = useGameStore((s) => s.completeTask)
  const assignTaskToAgent = useGameStore((s) => s.assignTaskToAgent)
  const loadFromStrapi = useGameStore((s) => s.loadFromStrapi)
  const isLoaded = useGameStore((s) => s.isLoaded)

  useEffect(() => {
    if (!isLoaded) loadFromStrapi()
  }, [isLoaded, loadFromStrapi])

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')

  const availableAgents = agents.filter(a => a.status === 'idle')

  return (
    <div
      className="rounded-xl p-4 backdrop-blur-md border"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
        borderColor: 'rgba(14,165,233,0.2)',
      }}
    >
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
        <span>📋</span> Tasks
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' }}>
          {tasks.length}
        </span>
      </h2>

      {/* In Progress */}
      {inProgressTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase mb-2" style={{ color: '#eab308' }}>
            ◐ In Progress ({inProgressTasks.length})
          </h3>
          {inProgressTasks.map((task) => {
            const assignedAgent = agents.find(a => a.id === task.assignedTo)
            return (
              <TaskCard
                key={task.id}
                task={task}
                assignedAgent={assignedAgent}
                availableAgents={availableAgents}
                onAssign={(agentId) => assignTaskToAgent(agentId, task.id)}
                onComplete={() => completeTask(task.id)}
              />
            )
          })}
        </div>
      )}

      {/* To Do */}
      {todoTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase mb-2" style={{ color: '#94a3b8' }}>
            ○ To Do ({todoTasks.length})
          </h3>
          {todoTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              availableAgents={availableAgents}
              onAssign={(agentId) => assignTaskToAgent(agentId, task.id)}
            />
          ))}
        </div>
      )}

      {/* Done */}
      {doneTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase mb-2" style={{ color: '#22c55e' }}>
            ● Done ({doneTasks.length})
          </h3>
          {doneTasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className="mb-1 p-2 rounded-lg opacity-50 text-xs"
              style={{ background: 'rgba(30,41,59,0.5)', color: '#64748b' }}
            >
              ✅ {task.title}
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: '#64748b' }}>
          Loading tasks...
        </div>
      )}
    </div>
  )
}

function TaskCard({
  task,
  assignedAgent,
  availableAgents,
  onAssign,
  onComplete,
}: {
  task: { id: string; title: string; priority: string; rpgCategory?: string; status: string; xpReward: number; resourceReward?: Record<string, number> }
  assignedAgent?: { id: string; name: string; emoji: string }
  availableAgents: { id: string; name: string; emoji: string }[]
  onAssign: (agentId: string) => void
  onComplete?: () => void
}) {
  const cat = task.rpgCategory || 'build'
  const catColor = CATEGORY_COLORS[cat] || '#64748b'
  const catEmoji = CATEGORY_EMOJI[cat] || '📦'
  const prioColor = PRIORITY_COLORS[task.priority] || '#64748b'

  return (
    <div
      className="mb-2 p-3 rounded-lg border transition-all hover:border-opacity-60"
      style={{
        background: 'rgba(30,41,59,0.6)',
        borderColor: `${catColor}33`,
      }}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex-1">
          <div className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Category badge */}
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: `${catColor}20`, color: catColor }}
            >
              {catEmoji} {cat}
            </span>
            {/* Priority badge */}
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: `${prioColor}20`, color: prioColor }}
            >
              {task.priority}
            </span>
            {/* XP reward */}
            <span className="text-xs" style={{ color: '#94a3b8' }}>
              +{task.xpReward} XP
            </span>
          </div>
          {/* Resource rewards */}
          {task.resourceReward && (
            <div className="flex gap-1.5 mt-1">
              {Object.entries(task.resourceReward).map(([key, val]) => (
                <span key={key} className="text-xs" style={{ color: '#94a3b8' }}>
                  +{val} {key}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned agent or assign dropdown */}
      <div className="flex items-center gap-2 mt-2">
        {assignedAgent ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{assignedAgent.emoji}</span>
            <span className="text-xs font-medium" style={{ color: '#0ea5e9' }}>
              {assignedAgent.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <select
            className="text-xs rounded px-2 py-1 border"
            style={{
              background: 'rgba(15,23,42,0.8)',
              borderColor: 'rgba(100,116,139,0.3)',
              color: '#94a3b8',
            }}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onAssign(e.target.value)
            }}
          >
            <option value="" disabled>
              Assign agent...
            </option>
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.emoji} {agent.name.split(' ')[0]}
              </option>
            ))}
          </select>
        )}

        {/* Complete button */}
        {task.status === 'in_progress' && assignedAgent && onComplete && (
          <button
            onClick={onComplete}
            className="ml-auto text-xs px-3 py-1 rounded-lg font-bold transition-all"
            style={{
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            ✅ Complete
          </button>
        )}
      </div>
    </div>
  )
}
