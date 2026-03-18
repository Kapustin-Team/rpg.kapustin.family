'use client'

import { useGameStore } from '@/store/gameStore'

const CLASS_LABELS: Record<string, string> = {
  developer: '⚙️ Developer',
  designer: '🎨 Designer',
  strategist: '♟️ Strategist',
  explorer: '🧭 Explorer',
  trader: '💰 Trader',
}

const RPG_CATEGORY_ICONS: Record<string, string> = {
  build: '⚒️',
  research: '🔬',
  trade: '💰',
  defense: '⚔️',
  exploration: '🗺️',
}

const panelStyle = {
  background: 'rgba(13, 17, 23, 0.92)',
  border: '1px solid #c9a84c',
  boxShadow: '0 0 20px rgba(201, 168, 76, 0.15)',
  borderRadius: 4,
  backdropFilter: 'blur(12px)',
} as const

export function HUD() {
  const { character, setIsPanelOpen, isPanelOpen, tasks } = useGameStore()
  const xpPercent = Math.floor((character.xp / character.xpToNextLevel) * 100)
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 5)

  return (
    <>
      {/* Bottom-left: Character card */}
      <div style={{
        ...panelStyle,
        position: 'absolute',
        bottom: 16, left: 16,
        padding: '12px 16px',
        minWidth: 240,
        zIndex: 10,
      }}>
        {/* Clan banner */}
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 10,
          color: '#c9a84c',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8,
          textShadow: '0 0 8px rgba(201, 168, 76, 0.2)',
        }}>
          House Kapustin
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: 4,
            background: 'linear-gradient(135deg, #c9a84c, #7c5c3e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '2px solid #c9a84c',
            boxShadow: '0 0 10px rgba(201, 168, 76, 0.2)',
          }}>
            {character.level >= 10 ? '👑' : '🧑‍💻'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700, fontSize: 14, color: '#e8dcc8',
            }}>
              {character.name}
            </div>
            <div style={{ fontSize: 12, color: '#c9a84c' }}>
              {CLASS_LABELS[character.class] || character.class}
            </div>
          </div>
          {/* Level badge */}
          <div style={{
            background: 'rgba(201, 168, 76, 0.15)',
            border: '2px solid #c9a84c',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: "'Courier New', monospace",
            fontSize: 18, fontWeight: 800, color: '#c9a84c',
            textShadow: '0 0 8px rgba(201, 168, 76, 0.3)',
          }}>
            {character.level}
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: '#8b8680', marginBottom: 3,
            fontFamily: "'Courier New', monospace",
          }}>
            <span>XP</span>
            <span>{character.xp.toLocaleString()} / {character.xpToNextLevel.toLocaleString()}</span>
          </div>
          <div style={{
            background: '#1a1a2e', borderRadius: 2, height: 6, overflow: 'hidden',
            border: '1px solid rgba(201, 168, 76, 0.2)',
          }}>
            <div style={{
              width: `${xpPercent}%`, height: '100%',
              background: 'linear-gradient(to right, #c9a84c, #e8c97e)',
              borderRadius: 2, transition: 'width 0.5s ease',
              boxShadow: '0 0 6px rgba(201, 168, 76, 0.4)',
            }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#8b8680' }}>
          <span>🔥 {character.streakDays} streak</span>
          <span>✅ {character.totalTasksCompleted} done</span>
        </div>
      </div>

      {/* Bottom-right: Mini task list + panel toggle */}
      <div style={{
        ...panelStyle,
        position: 'absolute',
        bottom: 16, right: 16,
        padding: '10px 14px',
        width: 260,
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 11, fontWeight: 700, color: '#c9a84c',
            letterSpacing: 1,
          }}>
            QUESTS
          </span>
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            style={{
              background: isPanelOpen
                ? 'linear-gradient(135deg, #c9a84c, #7c5c3e)'
                : 'rgba(201, 168, 76, 0.1)',
              border: '1px solid #c9a84c',
              borderRadius: 4,
              padding: '2px 10px',
              color: isPanelOpen ? '#0d1117' : '#c9a84c',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'Cinzel, serif',
              transition: 'all 0.2s',
            }}
          >
            {doneTasks}/{totalTasks}
          </button>
        </div>

        {/* Top 5 active tasks */}
        {activeTasks.length > 0 ? (
          activeTasks.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '3px 0',
              borderBottom: '1px solid rgba(201, 168, 76, 0.08)',
              fontSize: 12,
            }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>
                {task.rpgCategory ? RPG_CATEGORY_ICONS[task.rpgCategory] || '📌' : '📌'}
              </span>
              <span style={{
                color: '#e8dcc8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {task.title}
              </span>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: '#c9a84c',
                flexShrink: 0,
              }}>
                +{task.xpReward}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 11, color: '#8b8680', textAlign: 'center', padding: 8 }}>
            All quests completed!
          </div>
        )}
      </div>
    </>
  )
}
