'use client'

import { useGameStore } from '@/store/gameStore'

export default function ResourceBar() {
  const resources = useGameStore((s) => s.resources)

  return (
    <div
      className="rounded-xl p-2.5 backdrop-blur-md border flex flex-wrap gap-2"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))',
        borderColor: 'rgba(14,165,233,0.2)',
      }}
    >
      {resources.map((r) => {
        const pct = (r.amount / r.maxCapacity) * 100
        return (
          <div
            key={r.type}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(30,41,59,0.5)',
              border: `1px solid ${r.color}22`,
              minWidth: 90,
            }}
            title={`${r.label}: ${Math.floor(r.amount)}/${r.maxCapacity} (+${r.productionRate}/tick)`}
          >
            <span className="text-sm">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold" style={{ color: r.color }}>
                  {Math.floor(r.amount)}
                </span>
                <span className="text-xs" style={{ color: '#475569' }}>
                  /{r.maxCapacity}
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.6)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: r.color,
                    boxShadow: `0 0 4px ${r.color}80`,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
