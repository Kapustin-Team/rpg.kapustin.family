'use client'

import { useGameStore } from '@/store/gameStore'

export default function AgentPanel() {
  const agents = useGameStore((s) => s.agents)
  const selectedAgentId = useGameStore((s) => s.selectedAgentId)
  const setSelectedAgent = useGameStore((s) => s.setSelectedAgent)
  const tasks = useGameStore((s) => s.tasks)

  const agent = agents.find((a) => a.id === selectedAgentId)
  if (!agent) return null

  const currentTask = tasks.find((t) => t.id === agent.currentTaskId)

  return (
    <div
      className="rounded-xl p-4 backdrop-blur-md border"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
        borderColor: `${agent.color}44`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <div className="text-white font-bold text-sm">{agent.name}</div>
            <div className="text-xs" style={{ color: agent.color }}>
              {agent.role}
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedAgent(null)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: agent.status === 'idle'
              ? 'rgba(34,197,94,0.15)'
              : agent.status === 'working'
              ? 'rgba(234,179,8,0.15)'
              : 'rgba(14,165,233,0.15)',
            color: agent.status === 'idle'
              ? '#22c55e'
              : agent.status === 'working'
              ? '#eab308'
              : '#0ea5e9',
            border: `1px solid ${
              agent.status === 'idle'
                ? 'rgba(34,197,94,0.3)'
                : agent.status === 'working'
                ? 'rgba(234,179,8,0.3)'
                : 'rgba(14,165,233,0.3)'
            }`,
          }}
        >
          {agent.status === 'idle' ? '● Idle' : agent.status === 'working' ? '◐ Working' : '→ Moving'}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
        {agent.description}
      </p>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1 mb-3">
        {agent.specialization.map((spec) => (
          <span
            key={spec}
            className="px-2 py-0.5 rounded text-xs"
            style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}
          >
            {spec}
          </span>
        ))}
      </div>

      {/* Current task */}
      {currentTask && (
        <div
          className="p-2 rounded-lg mb-3"
          style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}
        >
          <div className="text-xs font-bold" style={{ color: '#eab308' }}>
            Current Task:
          </div>
          <div className="text-xs mt-1" style={{ color: '#e2e8f0' }}>
            {currentTask.title}
          </div>
        </div>
      )}

      {/* Position */}
      <div className="text-xs" style={{ color: '#64748b' }}>
        📍 Position: ({agent.position[0].toFixed(1)}, {agent.position[2].toFixed(1)})
      </div>

      {/* Right-click hint */}
      <div className="mt-2 text-xs" style={{ color: '#475569' }}>
        💡 Right-click on ground/building to move agent
      </div>
    </div>
  )
}
