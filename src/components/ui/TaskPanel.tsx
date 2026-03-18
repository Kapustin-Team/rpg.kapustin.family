'use client'

import { useGameStore, Task } from '@/store/gameStore'

const PRIORITY_COLORS = {
  low: '#2d5a27',
  medium: '#c9a84c',
  high: '#d97706',
  critical: '#8b1a1a',
}

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const RPG_CATEGORY_ICONS: Record<string, string> = {
  build: '⚒️',
  research: '🔬',
  trade: '💰',
  defense: '⚔️',
  exploration: '🗺️',
}

const STATUS_LABELS = {
  todo: 'Queued',
  in_progress: 'Active',
  done: 'Done',
}

const panelStyle = {
  background: 'rgba(13, 17, 23, 0.92)',
  border: '1px solid #c9a84c',
  boxShadow: '0 0 20px rgba(201, 168, 76, 0.15)',
  borderRadius: 4,
  backdropFilter: 'blur(12px)',
} as const

function TaskCard({ task }: { task: Task }) {
  const { completeTask } = useGameStore()
  const isDone = task.status === 'done'

  return (
    <div style={{
      background: isDone ? 'rgba(45, 90, 39, 0.08)' : 'rgba(201, 168, 76, 0.03)',
      border: `1px solid ${isDone ? 'rgba(45, 90, 39, 0.3)' : 'rgba(201, 168, 76, 0.15)'}`,
      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
      borderRadius: 4,
      padding: '10px 12px',
      marginBottom: 6,
      opacity: isDone ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button
          onClick={() => !isDone && completeTask(task.id)}
          disabled={isDone}
          style={{
            width: 18, height: 18, borderRadius: 2, flexShrink: 0, marginTop: 1,
            background: isDone ? '#2d5a27' : 'transparent',
            border: `2px solid ${isDone ? '#2d5a27' : '#c9a84c'}`,
            cursor: isDone ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#e8dcc8', fontSize: 10,
          }}
        >
          {isDone ? '✓' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: isDone ? '#6b7280' : '#e8dcc8',
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: 4, lineHeight: 1.3,
          }}>
            {task.rpgCategory && (
              <span style={{ marginRight: 4 }}>{RPG_CATEGORY_ICONS[task.rpgCategory]}</span>
            )}
            {task.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 9, color: PRIORITY_COLORS[task.priority],
              border: `1px solid ${PRIORITY_COLORS[task.priority]}60`,
              borderRadius: 2, padding: '1px 5px',
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              {PRIORITY_LABELS[task.priority]}
            </span>

            <span style={{ fontSize: 10, color: '#8b8680' }}>
              {STATUS_LABELS[task.status]}
            </span>

            <span style={{
              fontSize: 10,
              color: '#c9a84c',
              marginLeft: 'auto',
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
            }}>
              +{task.xpReward} XP
            </span>
          </div>

          {task.dueDate && !isDone && (
            <div style={{ fontSize: 10, color: '#d97706', marginTop: 3 }}>
              📅 {new Date(task.dueDate).toLocaleDateString('ru-RU')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TaskPanel() {
  const { tasks, isPanelOpen, setIsPanelOpen } = useGameStore()

  if (!isPanelOpen) return null

  const activeTasks = tasks.filter(t => t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')

  return (
    <div style={{
      ...panelStyle,
      position: 'absolute',
      top: 50, right: 16, bottom: 80,
      width: 340,
      display: 'flex', flexDirection: 'column',
      zIndex: 20,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
        display: 'flex', alignItems: 'center',
        background: 'rgba(201, 168, 76, 0.05)',
      }}>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 14, fontWeight: 700, color: '#c9a84c',
          letterSpacing: 1,
        }}>
          QUEST LOG
        </span>
        <button
          onClick={() => setIsPanelOpen(false)}
          style={{
            marginLeft: 'auto', background: 'none',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: 2,
            color: '#8b8680', cursor: 'pointer', fontSize: 14,
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {activeTasks.length > 0 && (
          <>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10, color: '#c9a84c',
              textTransform: 'uppercase',
              letterSpacing: 2, marginBottom: 8,
            }}>
              Active ({activeTasks.length})
            </div>
            {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </>
        )}

        {doneTasks.length > 0 && (
          <>
            <div style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10, color: '#8b8680',
              textTransform: 'uppercase',
              letterSpacing: 2, marginTop: 14, marginBottom: 8,
            }}>
              Completed ({doneTasks.length})
            </div>
            {doneTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(201, 168, 76, 0.2)',
        background: 'rgba(201, 168, 76, 0.03)',
      }}>
        <span style={{ fontSize: 10, color: '#8b8680', fontStyle: 'italic' }}>
          Complete quests to earn XP and grow your kingdom
        </span>
      </div>
    </div>
  )
}
