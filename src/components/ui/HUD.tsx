'use client'

import { useGameStore } from '@/store/gameStore'
import ResourceBar from './ResourceBar'
import BuildMenu from './BuildMenu'
import AgentPanel from './AgentPanel'
import TaskPanel from './TaskPanel'
import { useState } from 'react'

export default function HUD() {
  const character = useGameStore((s) => s.character)
  const isPanelOpen = useGameStore((s) => s.isPanelOpen)
  const setIsPanelOpen = useGameStore((s) => s.setIsPanelOpen)
  const editMode = useGameStore((s) => s.editMode)
  const setEditMode = useGameStore((s) => s.setEditMode)
  const selectedAgentId = useGameStore((s) => s.selectedAgentId)
  const [showTasks, setShowTasks] = useState(false)

  const xpPercent = (character.xp / character.xpToNextLevel) * 100

  return (
    <div className="fixed inset-0 pointer-events-none z-10" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Top bar — character + resources */}
      <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-start gap-3 p-3">
        {/* Character info */}
        <div
          className="flex-shrink-0 rounded-xl p-3 backdrop-blur-md border"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))',
            borderColor: 'rgba(14,165,233,0.3)',
            minWidth: 220,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👤</span>
            <div>
              <div className="text-white font-bold text-sm">{character.name}</div>
              <div className="text-xs" style={{ color: '#94a3b8' }}>
                {character.class === 'strategist' ? '🎯 Стратег' : character.class} • Streak: {character.streakDays}🔥
              </div>
            </div>
          </div>

          {/* Level & XP */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(14,165,233,0.2)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.4)' }}
            >
              LV.{character.level}
            </span>
            <span className="text-xs" style={{ color: '#64748b' }}>
              {character.xp}/{character.xpToNextLevel} XP
            </span>
          </div>

          {/* XP bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.6)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpPercent}%`,
                background: 'linear-gradient(90deg, #0ea5e9, #22d3ee)',
                boxShadow: '0 0 8px rgba(14,165,233,0.5)',
              }}
            />
          </div>

          <div className="text-xs mt-1" style={{ color: '#64748b' }}>
            ✅ Tasks: {character.totalTasksCompleted}
          </div>
        </div>

        {/* Resources */}
        <div className="flex-1">
          <ResourceBar />
        </div>
      </div>

      {/* Right side controls */}
      <div className="pointer-events-auto absolute top-3 right-3 flex flex-col gap-2">
        {/* Edit Mode Toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all border"
          style={{
            background: editMode
              ? 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(34,211,238,0.2))'
              : 'rgba(15,23,42,0.8)',
            borderColor: editMode ? '#0ea5e9' : 'rgba(100,116,139,0.3)',
            color: editMode ? '#22d3ee' : '#94a3b8',
            backdropFilter: 'blur(12px)',
            boxShadow: editMode ? '0 0 15px rgba(14,165,233,0.3)' : 'none',
          }}
        >
          {editMode ? '✏️ Edit Mode ON' : '🔧 Edit Mode'}
        </button>

        {/* Tasks toggle */}
        <button
          onClick={() => setShowTasks(!showTasks)}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all border"
          style={{
            background: showTasks ? 'rgba(14,165,233,0.15)' : 'rgba(15,23,42,0.8)',
            borderColor: showTasks ? 'rgba(14,165,233,0.4)' : 'rgba(100,116,139,0.3)',
            color: showTasks ? '#0ea5e9' : '#94a3b8',
            backdropFilter: 'blur(12px)',
          }}
        >
          📋 Tasks
        </button>

        {/* Build menu toggle */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all border"
          style={{
            background: isPanelOpen ? 'rgba(14,165,233,0.15)' : 'rgba(15,23,42,0.8)',
            borderColor: isPanelOpen ? 'rgba(14,165,233,0.4)' : 'rgba(100,116,139,0.3)',
            color: isPanelOpen ? '#0ea5e9' : '#94a3b8',
            backdropFilter: 'blur(12px)',
          }}
        >
          🏗️ Build
        </button>
      </div>

      {/* Edit mode indicator */}
      {editMode && (
        <div
          className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(14,165,233,0.15)',
            color: '#22d3ee',
            border: '1px solid rgba(14,165,233,0.4)',
            backdropFilter: 'blur(12px)',
            animation: 'pulse 2s infinite',
          }}
        >
          ✏️ EDIT MODE — Drag buildings to reposition • R to rotate • ESC to exit
        </div>
      )}

      {/* Build menu panel */}
      {isPanelOpen && (
        <div className="pointer-events-auto absolute left-3 bottom-3">
          <BuildMenu />
        </div>
      )}

      {/* Task panel */}
      {showTasks && (
        <div className="pointer-events-auto absolute right-3 top-32 w-96 max-h-[70vh] overflow-y-auto">
          <TaskPanel />
        </div>
      )}

      {/* Agent panel */}
      {selectedAgentId && (
        <div className="pointer-events-auto absolute bottom-3 right-3 w-80">
          <AgentPanel />
        </div>
      )}

      {/* Controls help */}
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs"
        style={{
          background: 'rgba(15,23,42,0.7)',
          color: '#64748b',
          border: '1px solid rgba(100,116,139,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        WASD — Move Camera • Left Click — Select • Right Click — Move Agent • Scroll — Zoom
      </div>
    </div>
  )
}
