'use client'

import { useGameStore, Task } from '@/store/gameStore'

const PRIORITY_COLORS = {
  low: '#6b7280',
  medium: '#f4c542',
  high: '#f97316',
  critical: '#ef4444',
}

const PRIORITY_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: '🚨 Критично',
}

const RPG_CATEGORY_ICONS: Record<string, string> = {
  build: '🏗️',
  research: '🔬',
  trade: '💰',
  defense: '🛡️',
  exploration: '🧭',
}

const STATUS_LABELS = {
  todo: 'В очереди',
  in_progress: 'В работе',
  done: 'Готово',
}

interface TaskCardProps { task: Task }

function TaskCard({ task }: TaskCardProps) {
  const { completeTask } = useGameStore()
  const isDone = task.status === 'done'

  return (
    <div style={{
      background: isDone ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isDone ? '#10b98130' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
      opacity: isDone ? 0.6 : 1,
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Чекбокс */}
        <button
          onClick={() => !isDone && completeTask(task.id)}
          disabled={isDone}
          style={{
            width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
            background: isDone ? '#10b981' : 'transparent',
            border: `2px solid ${isDone ? '#10b981' : '#6b7280'}`,
            cursor: isDone ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 10,
          }}
        >
          {isDone ? '✓' : ''}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: isDone ? '#6b7280' : '#e8dcc8',
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: 4,
            lineHeight: 1.3,
          }}>
            {task.rpgCategory && (
              <span style={{ marginRight: 4 }}>{RPG_CATEGORY_ICONS[task.rpgCategory]}</span>
            )}
            {task.title}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* Приоритет */}
            <span style={{
              fontSize: 10, color: PRIORITY_COLORS[task.priority],
              border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
              borderRadius: 4, padding: '1px 5px',
            }}>
              {PRIORITY_LABELS[task.priority]}
            </span>

            {/* Статус */}
            <span style={{ fontSize: 10, color: '#6b7280' }}>
              {STATUS_LABELS[task.status]}
            </span>

            {/* XP */}
            <span style={{ fontSize: 10, color: '#7c3aed', marginLeft: 'auto' }}>
              +{task.xpReward} XP
            </span>
          </div>

          {task.dueDate && !isDone && (
            <div style={{ fontSize: 10, color: '#f97316', marginTop: 3 }}>
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
      position: 'absolute',
      top: 60, right: 20, bottom: 80,
      width: 320,
      background: 'rgba(10,15,26,0.96)',
      border: '1px solid rgba(244,197,66,0.2)',
      borderRadius: 16,
      display: 'flex', flexDirection: 'column',
      zIndex: 20,
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      {/* Заголовок */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#e8dcc8' }}>📋 Задачи</span>
        <button
          onClick={() => setIsPanelOpen(false)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#6b7280', cursor: 'pointer', fontSize: 18,
          }}
        >×</button>
      </div>

      {/* Список */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {activeTasks.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Активные ({activeTasks.length})
            </div>
            {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </>
        )}

        {doneTasks.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 8 }}>
              Выполнено ({doneTasks.length})
            </div>
            {doneTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </>
        )}
      </div>

      {/* Футер */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Нажми на задачу чтобы завершить → получишь XP
        </span>
      </div>
    </div>
  )
}
