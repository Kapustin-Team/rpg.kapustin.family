'use client'

import { useGameStore } from '@/store/gameStore'

const CLASS_LABELS: Record<string, string> = {
  developer: '⚙️ Разработчик',
  designer: '🎨 Дизайнер',
  strategist: '♟️ Стратег',
  explorer: '🧭 Исследователь',
  trader: '💰 Торговец',
}

export function HUD() {
  const { character, setIsPanelOpen, isPanelOpen, tasks } = useGameStore()
  const xpPercent = Math.floor((character.xp / character.xpToNextLevel) * 100)
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length

  return (
    <>
      {/* Левый блок — персонаж */}
      <div style={{
        position: 'absolute',
        bottom: 20, left: 20,
        background: 'rgba(10,15,26,0.92)',
        border: '1px solid rgba(244,197,66,0.25)',
        borderRadius: 12,
        padding: '14px 18px',
        minWidth: 220,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f4c542, #a8852c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '2px solid #f4c54250',
          }}>
            {character.level >= 10 ? '👑' : '🧑‍💻'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e8dcc8' }}>{character.name}</div>
            <div style={{ fontSize: 11, color: '#f4c542' }}>{CLASS_LABELS[character.class] || character.class}</div>
          </div>
          <div style={{
            marginLeft: 'auto',
            background: '#f4c54220',
            border: '1px solid #f4c54250',
            borderRadius: 8,
            padding: '2px 8px',
            fontSize: 18, fontWeight: 800, color: '#f4c542',
          }}>
            {character.level}
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6b7280', marginBottom: 3 }}>
            <span>XP</span>
            <span>{character.xp.toLocaleString()} / {character.xpToNextLevel.toLocaleString()}</span>
          </div>
          <div style={{ background: '#1a2040', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${xpPercent}%`, height: '100%',
              background: 'linear-gradient(to right, #7c3aed, #a855f7)',
              borderRadius: 4, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Статы */}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#6b7280' }}>
          <span>🔥 {character.streakDays} дней</span>
          <span>✅ {character.totalTasksCompleted} задач</span>
        </div>
      </div>

      {/* Правый блок — кнопка задач */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10 }}>
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          style={{
            background: isPanelOpen
              ? 'linear-gradient(135deg, #f4c542, #a8852c)'
              : 'rgba(10,15,26,0.92)',
            border: '1px solid rgba(244,197,66,0.4)',
            borderRadius: 12,
            padding: '12px 20px',
            color: isPanelOpen ? '#0a0f1a' : '#f4c542',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          📋 Задачи
          <span style={{
            background: isPanelOpen ? '#0a0f1a40' : '#f4c54220',
            borderRadius: 10,
            padding: '1px 7px',
            fontSize: 11,
          }}>
            {doneTasks}/{totalTasks}
          </span>
        </button>
      </div>
    </>
  )
}
