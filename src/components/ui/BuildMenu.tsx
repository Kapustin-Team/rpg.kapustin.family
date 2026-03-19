'use client'

import { useGameStore } from '@/store/gameStore'
import { BUILDING_TEMPLATES } from '@/data/buildings'

export default function BuildMenu() {
  const resources = useGameStore((s) => s.resources)
  const buildingPlacementType = useGameStore((s) => s.buildingPlacementType)
  const setBuildingPlacementType = useGameStore((s) => s.setBuildingPlacementType)

  const gold = resources.find((r) => r.type === 'gold')?.amount ?? 0
  const wood = resources.find((r) => r.type === 'wood')?.amount ?? 0
  const stone = resources.find((r) => r.type === 'stone')?.amount ?? 0

  return (
    <div
      className="rounded-xl p-4 backdrop-blur-md border w-72"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.9))',
        borderColor: 'rgba(14,165,233,0.2)',
      }}
    >
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
        <span>🏗️</span> Build Menu
      </h2>

      <div className="space-y-2">
        {BUILDING_TEMPLATES.filter(t => t.type !== 'hq').map((template) => {
          const canAfford =
            gold >= template.costGold &&
            wood >= template.costWood &&
            stone >= template.costStone
          const isActive = buildingPlacementType === template.type

          return (
            <button
              key={template.type}
              onClick={() =>
                setBuildingPlacementType(isActive ? null : template.type)
              }
              disabled={!canAfford}
              className="w-full text-left p-3 rounded-lg border transition-all"
              style={{
                background: isActive
                  ? `${template.color}20`
                  : canAfford
                  ? 'rgba(30,41,59,0.5)'
                  : 'rgba(30,41,59,0.3)',
                borderColor: isActive
                  ? template.color
                  : canAfford
                  ? 'rgba(100,116,139,0.2)'
                  : 'rgba(100,116,139,0.1)',
                opacity: canAfford ? 1 : 0.5,
                cursor: canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{template.emoji}</span>
                <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                  {template.name}
                </span>
              </div>
              <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>
                {template.description}
              </div>
              <div className="flex gap-2 text-xs" style={{ color: '#64748b' }}>
                {template.costGold > 0 && (
                  <span style={{ color: gold >= template.costGold ? '#fbbf24' : '#ef4444' }}>
                    🪙{template.costGold}
                  </span>
                )}
                {template.costWood > 0 && (
                  <span style={{ color: wood >= template.costWood ? '#8b5e3c' : '#ef4444' }}>
                    🪵{template.costWood}
                  </span>
                )}
                {template.costStone > 0 && (
                  <span style={{ color: stone >= template.costStone ? '#6b7280' : '#ef4444' }}>
                    🪨{template.costStone}
                  </span>
                )}
                <span className="ml-auto" style={{ color: '#0ea5e9' }}>
                  👷 {template.workerSlots} slots
                </span>
              </div>
              {isActive && (
                <div className="text-xs mt-1 font-bold" style={{ color: '#22d3ee' }}>
                  Click on map to place!
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
