'use client'

import { useGameStore } from '@/store/gameStore'

const RESOURCE_ORDER = ['food', 'wood', 'stone', 'gold', 'knowledge', 'data', 'code'] as const

export function ResourceBar() {
  const { resources } = useGameStore()

  const topResources = RESOURCE_ORDER
    .map(type => resources.find(r => r.type === type))
    .filter(Boolean) as typeof resources

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      padding: '6px 16px',
      background: 'rgba(13, 17, 23, 0.95)',
      borderBottom: '2px solid rgba(201, 168, 76, 0.4)',
      boxShadow: '0 2px 20px rgba(201, 168, 76, 0.1)',
      zIndex: 10,
      fontFamily: 'Crimson Text, serif',
    }}>
      {/* Game title */}
      <div style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 13,
        fontWeight: 700,
        color: '#c9a84c',
        marginRight: 16,
        letterSpacing: 1,
        textShadow: '0 0 10px rgba(201, 168, 76, 0.3)',
        whiteSpace: 'nowrap',
      }}>
        NORTH GARD
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(201, 168, 76, 0.3)', marginRight: 8 }} />

      {/* Resources */}
      {topResources.map((resource) => (
        <div key={resource.type} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 4,
          background: 'rgba(201, 168, 76, 0.05)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
        }}>
          <span style={{ fontSize: 14 }}>{resource.icon}</span>
          <span style={{
            fontSize: 13,
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            color: '#e8c97e',
            minWidth: 32,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.floor(resource.amount).toLocaleString()}
          </span>
          <span style={{
            fontSize: 9,
            color: '#2d5a27',
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
          }}>
            +{resource.productionRate}
          </span>
        </div>
      ))}
    </div>
  )
}
