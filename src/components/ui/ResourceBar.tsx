'use client'

import { useGameStore } from '@/store/gameStore'

export function ResourceBar() {
  const { resources } = useGameStore()

  // Показываем только ключевые ресурсы в топ-баре
  const topResources = resources.filter(r =>
    ['gold', 'food', 'data', 'code', 'knowledge', 'energy'].includes(r.type)
  )

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '10px 16px',
      background: 'linear-gradient(to bottom, rgba(10,15,26,0.95), transparent)',
      backdropFilter: 'blur(4px)',
      zIndex: 10,
    }}>
      {topResources.map((resource) => (
        <div key={resource.type} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${resource.color}30`,
          borderRadius: 6,
          padding: '4px 10px',
          minWidth: 90,
        }}>
          <span style={{ fontSize: 14 }}>{resource.icon}</span>
          <div>
            <div style={{ fontSize: 12, color: resource.color, fontWeight: 600, lineHeight: 1 }}>
              {Math.floor(resource.amount).toLocaleString()}
            </div>
            <div style={{ fontSize: 9, color: '#6b7280', lineHeight: 1 }}>
              {resource.label}
            </div>
          </div>
          <div style={{ fontSize: 9, color: '#10b981', marginLeft: 2 }}>
            +{resource.productionRate}/с
          </div>
        </div>
      ))}
    </div>
  )
}
