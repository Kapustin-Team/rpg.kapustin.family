"use client"
import { useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { BUILDING_TEMPLATES } from "@/data/buildings"

export function BuildMenu() {
  const [open, setOpen] = useState(false)
  const resources = useGameStore((s) => s.resources)
  const setBuildingPlacementType = useGameStore((s) => s.setBuildingPlacementType)
  const buildingPlacementType = useGameStore((s) => s.buildingPlacementType)

  const getResource = (type: string) => resources.find((r) => r.type === type)?.amount ?? 0

  const canAfford = (t: (typeof BUILDING_TEMPLATES)[0]) =>
    getResource("gold") >= t.costGold &&
    getResource("wood") >= t.costWood &&
    getResource("stone") >= t.costStone

  return (
    <>
      {/* Placement tooltip */}
      {buildingPlacementType && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(13,17,23,0.92)",
            border: "1px solid #c9a84c",
            borderRadius: 4,
            padding: "6px 16px",
            color: "#c9a84c",
            fontSize: 13,
            fontFamily: "'Crimson Text', serif",
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          Click on the map to place{" "}
          <strong>
            {BUILDING_TEMPLATES.find((t) => t.type === buildingPlacementType)?.name}
          </strong>
          . Press ESC to cancel.
        </div>
      )}

      {/* Building cards */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
            zIndex: 100,
          }}
        >
          {BUILDING_TEMPLATES.map((t) => {
            const affordable = canAfford(t)
            return (
              <div
                key={t.type}
                onClick={() => {
                  if (!affordable) return
                  setBuildingPlacementType(t.type)
                  setOpen(false)
                }}
                style={{
                  width: 120,
                  padding: "10px 8px",
                  background: "rgba(13,17,23,0.95)",
                  border: `1px solid ${affordable ? "#c9a84c" : "#4a4a4a"}`,
                  borderRadius: 4,
                  cursor: affordable ? "pointer" : "not-allowed",
                  opacity: affordable ? 1 : 0.5,
                  fontFamily: "'Crimson Text', serif",
                  color: "#e8dcc8",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{t.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{t.name}</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, fontSize: 10, color: "#8b8680" }}>
                  {t.costGold > 0 && <span>🪙{t.costGold}</span>}
                  {t.costWood > 0 && <span>🪵{t.costWood}</span>}
                  {t.costStone > 0 && <span>🪨{t.costStone}</span>}
                  {t.costGold === 0 && t.costWood === 0 && t.costStone === 0 && <span>Free</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(13,17,23,0.92)",
          border: "1px solid #c9a84c",
          color: "#c9a84c",
          padding: "8px 24px",
          borderRadius: 4,
          fontSize: 14,
          fontFamily: "Cinzel, serif",
          cursor: "pointer",
          letterSpacing: 1,
          zIndex: 100,
          boxShadow: "0 0 20px rgba(201,168,76,0.15)",
        }}
      >
        {open ? "x CLOSE" : "⚒ BUILD"}
      </button>
    </>
  )
}
