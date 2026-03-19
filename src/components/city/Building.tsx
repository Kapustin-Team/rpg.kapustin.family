'use client'
import { useRef, useState, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { useGameStore, type Building as BuildingType } from '@/store/gameStore'
import { BUILDING_TEMPLATES } from '@/data/buildings'
import * as THREE from 'three'

/* ================================================
   Shared animated helpers
   ================================================ */
function BlinkingLight({ position, color = '#ff0000', speed = 2 }: { position: [number, number, number]; color?: string; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(s.clock.elapsedTime * speed) > 0 ? 2 : 0.2
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  )
}

function SpinningFan({ position, speed = 3 }: { position: [number, number, number]; speed?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed })
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.08]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function RotatingRing({ position, radius = 1, speed = 0.5, color = '#0ea5e9' }: { position: [number, number, number]; radius?: number; speed?: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed })
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, 0.03, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
    </mesh>
  )
}

function LEDStrip({ points, color = '#0ea5e9' }: { points: [number, number, number][]; color?: string }) {
  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      ))}
    </>
  )
}

function GlowingPanel({ position, size, color = '#0ea5e9', opacity = 0.4, rotation }: {
  position: [number, number, number]; size: [number, number, number]; color?: string; opacity?: number; rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={opacity} metalness={0.9} roughness={0.1} />
    </mesh>
  )
}

/** Repeated thin panel line for surface detail */
function PanelLine({ position, size, color = '#1a1a2e' }: { position: [number, number, number]; size: [number, number, number]; color?: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

/** Window with frame */
function WindowWithFrame({ position, size, frameColor = '#333', glassColor = '#a0d0ff', emissive = false }: {
  position: [number, number, number]; size: [number, number, number]; frameColor?: string; glassColor?: string; emissive?: boolean
}) {
  const [w, h, d] = size
  return (
    <group position={position}>
      {/* Glass */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.05} transparent opacity={0.6}
          {...(emissive ? { emissive: glassColor, emissiveIntensity: 0.3 } : {})} />
      </mesh>
      {/* Frame - top */}
      <mesh position={[0, h / 2, d / 2 + 0.002]}>
        <boxGeometry args={[w + 0.02, 0.015, 0.005]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Frame - bottom */}
      <mesh position={[0, -h / 2, d / 2 + 0.002]}>
        <boxGeometry args={[w + 0.02, 0.015, 0.005]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Frame - left */}
      <mesh position={[-w / 2, 0, d / 2 + 0.002]}>
        <boxGeometry args={[0.015, h + 0.02, 0.005]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Frame - right */}
      <mesh position={[w / 2, 0, d / 2 + 0.002]}>
        <boxGeometry args={[0.015, h + 0.02, 0.005]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}


/* ================================================
   HQ — Glass Skyscraper (150+ elements)
   ================================================ */
function HQModel() {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (ref.current) {
      const holo = ref.current.getObjectByName('holo')
      if (holo) holo.rotation.y = s.clock.elapsedTime * 0.3
    }
  })

  // Glass pane grid: 6 columns x 5 rows per side = 30 panes front, 30 back, 30 left, 30 right => subset for perf
  const glassPanesFront: [number, number][] = []
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row < 5; row++) {
      glassPanesFront.push([col, row])
    }
  }

  return (
    <group ref={ref}>
      {/* Podium level — different material (concrete/stone) */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Podium panel lines */}
      {[-0.15, 0.15].map((y, i) => (
        <PanelLine key={`pod-${i}`} position={[0, 0.08 + y, 0.71]} size={[1.38, 0.01, 0.01]} color="#5c5750" />
      ))}
      {/* Podium windows (ground floor) */}
      {[-0.4, -0.15, 0.15, 0.4].map((x, i) => (
        <WindowWithFrame key={`pw-${i}`} position={[x, 0.25, 0.71]} size={[0.18, 0.3, 0.02]} glassColor="#c8e0f0" />
      ))}

      {/* Main glass tower */}
      <mesh castShadow position={[0, 1.75, 0]}>
        <boxGeometry args={[1.2, 2.5, 1.2]} />
        <meshStandardMaterial color="#b8d4e8" metalness={0.9} roughness={0.1} transparent opacity={0.85} />
      </mesh>

      {/* Glass curtain wall — 30 individual panes (front) with mullions */}
      {glassPanesFront.map(([col, row]) => {
        const x = -0.45 + col * 0.18
        const y = 0.7 + row * 0.5
        return (
          <group key={`gp-f-${col}-${row}`}>
            {/* Glass pane */}
            <mesh position={[x, y, 0.605]}>
              <boxGeometry args={[0.16, 0.45, 0.01]} />
              <meshStandardMaterial color="#a8d8ea" metalness={0.95} roughness={0.05} transparent opacity={0.5} />
            </mesh>
            {/* Mullion vertical */}
            <mesh position={[x - 0.085, y, 0.612]}>
              <boxGeometry args={[0.008, 0.46, 0.006]} />
              <meshStandardMaterial color="#708090" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      })}
      {/* Horizontal mullions (floor slab edges) — front */}
      {[0.5, 1.0, 1.5, 2.0, 2.5].map((y, i) => (
        <mesh key={`fs-${i}`} position={[0, y, 0.612]}>
          <boxGeometry args={[1.18, 0.015, 0.006]} />
          <meshStandardMaterial color="#506070" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Glass curtain wall — back side (simplified 15 panes) */}
      {[0, 1, 2, 3, 4].map(row =>
        [-0.35, 0, 0.35].map((x, col) => (
          <mesh key={`gp-b-${col}-${row}`} position={[x, 0.7 + row * 0.5, -0.605]}>
            <boxGeometry args={[0.3, 0.45, 0.01]} />
            <meshStandardMaterial color="#a8d8ea" metalness={0.95} roughness={0.05} transparent opacity={0.5} />
          </mesh>
        ))
      )}

      {/* LED strip lighting on every floor edge — front */}
      {[0.5, 1.0, 1.5, 2.0, 2.5].map(y => (
        <mesh key={`led-f-${y}`} position={[0, y, 0.615]}>
          <boxGeometry args={[1.18, 0.01, 0.003]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* LED strips left edge */}
      <LEDStrip color="#0ea5e9" points={Array.from({ length: 12 }, (_, i) => [0.61, i * 0.25, 0] as [number, number, number])} />
      <LEDStrip color="#0ea5e9" points={Array.from({ length: 12 }, (_, i) => [-0.61, i * 0.25, 0] as [number, number, number])} />

      {/* Floor slab edges — left side */}
      {[0.5, 1.0, 1.5, 2.0, 2.5].map((y, i) => (
        <mesh key={`fsl-${i}`} position={[-0.612, y, 0]}>
          <boxGeometry args={[0.006, 0.015, 1.18]} />
          <meshStandardMaterial color="#506070" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Entrance — Revolving door */}
      <mesh position={[0, 0.2, 0.72]}>
        <cylinderGeometry args={[0.15, 0.15, 0.35, 12]} />
        <meshStandardMaterial color="#aad4ee" metalness={0.8} roughness={0.1} transparent opacity={0.4} />
      </mesh>
      {/* Revolving door blades */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh key={`rv-${i}`} position={[Math.sin(angle) * 0.07, 0.2, 0.72 + Math.cos(angle) * 0.07]}>
          <boxGeometry args={[0.14, 0.3, 0.004]} />
          <meshStandardMaterial color="#c0e0f0" metalness={0.9} roughness={0.05} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Canopy/awning over entrance */}
      <mesh position={[0, 0.48, 0.85]}>
        <boxGeometry args={[0.8, 0.03, 0.35]} />
        <meshStandardMaterial color="#506070" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Canopy supports */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={`cs-${i}`} position={[x, 0.35, 0.85]}>
          <cylinderGeometry args={[0.01, 0.01, 0.25, 4]} />
          <meshStandardMaterial color="#708090" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Reception desk visible through glass */}
      <mesh position={[0, 0.12, 0.55]}>
        <boxGeometry args={[0.4, 0.08, 0.12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* Ground floor atrium */}
      <mesh position={[0, 0.2, 0.3]}>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshStandardMaterial color="#e0f0ff" metalness={0.9} roughness={0.05} transparent opacity={0.5} />
      </mesh>

      {/* Mechanical floor at top (louvers) */}
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[1.22, 0.2, 1.22]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} />
      </mesh>
      {/* Louver slats */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`louver-${i}`} position={[0, 2.78 + i * 0.025, 0.615]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[1.18, 0.005, 0.03]} />
          <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Helipad on roof */}
      <mesh position={[0, 3.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#404040" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.35, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* H marking on helipad */}
      <mesh position={[-0.06, 3.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.03, 0.18]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.06, 3.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.03, 0.18]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 3.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.15, 0.03]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <BlinkingLight position={[0.35, 3.05, 0.35]} color="#ff0000" speed={3} />
      <BlinkingLight position={[-0.35, 3.05, -0.35]} color="#ff0000" speed={3} />
      <BlinkingLight position={[0.35, 3.05, -0.35]} color="#ff0000" speed={3} />
      <BlinkingLight position={[-0.35, 3.05, 0.35]} color="#ff0000" speed={3} />

      {/* Antenna array — multiple types */}
      {/* Whip antenna */}
      <mesh position={[0, 3.3, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      <BlinkingLight position={[0, 3.62, 0]} color="#ff0000" speed={1.5} />
      {/* Second whip */}
      <mesh position={[0.2, 3.2, 0.1]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Satellite dish */}
      <mesh position={[-0.3, 3.1, -0.2]} rotation={[0.4, 0.3, 0]}>
        <cylinderGeometry args={[0, 0.12, 0.06, 8]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, 3.15, -0.2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.08, 4]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Dome antenna */}
      <mesh position={[0.3, 3.05, -0.3]}>
        <sphereGeometry args={[0.06, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Company logo "K" on front — built from emissive boxes */}
      <group position={[0, 2.2, 0.62]}>
        {/* K left vertical */}
        <mesh position={[-0.08, 0, 0]}><boxGeometry args={[0.03, 0.25, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
        {/* K upper diagonal */}
        <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.03, 0.14, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
        {/* K lower diagonal */}
        <mesh position={[0, -0.06, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.03, 0.14, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
      </group>
      {/* K logo on right side */}
      <group position={[0.62, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[-0.08, 0, 0]}><boxGeometry args={[0.03, 0.25, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
        <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0.5]}><boxGeometry args={[0.03, 0.14, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
        <mesh position={[0, -0.06, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.03, 0.14, 0.01]} /><meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} /></mesh>
      </group>

      {/* Holographic display */}
      <group name="holo" position={[0, 0.8, 0.7]}>
        <GlowingPanel position={[0, 0, 0]} size={[0.4, 0.3, 0.01]} color="#0ea5e9" opacity={0.3} />
        <GlowingPanel position={[0.15, 0.05, 0.05]} size={[0.2, 0.15, 0.01]} color="#22d3ee" opacity={0.2} />
      </group>

      {/* Solar panels on back */}
      <mesh position={[0, 2.5, -0.62]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1, 0.6, 0.03]} />
        <meshStandardMaterial color="#1a1a3a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Solar panel grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`sp-${i}`} position={[-0.35 + i * 0.175, 2.5, -0.63]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.005, 0.58, 0.005]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}

      {/* Landscaping planters at base */}
      {[-0.55, -0.25, 0.25, 0.55].map((x, i) => (
        <group key={`pl-${i}`} position={[x, 0.02, 0.8]}>
          <mesh><boxGeometry args={[0.2, 0.08, 0.15]} /><meshStandardMaterial color="#64748b" roughness={0.9} /></mesh>
          <mesh position={[0, 0.06, 0]}><sphereGeometry args={[0.06, 6, 6]} /><meshStandardMaterial color="#22c55e" roughness={0.85} /></mesh>
          {i % 2 === 0 && <mesh position={[0.04, 0.08, 0]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#16a34a" roughness={0.85} /></mesh>}
        </group>
      ))}

      {/* Underground parking ramp */}
      <mesh position={[0.7, -0.05, 0.6]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.4, 0.03, 0.5]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      {/* Ramp side walls */}
      <mesh position={[0.5, -0.02, 0.6]}>
        <boxGeometry args={[0.03, 0.12, 0.5]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[0.9, -0.02, 0.6]}>
        <boxGeometry args={[0.03, 0.12, 0.5]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      {/* Security cameras */}
      {[[0.6, 2.8, 0.6], [-0.6, 2.8, -0.6], [0.6, 0.45, 0.72], [-0.6, 0.45, 0.72]].map((p, i) => (
        <mesh key={`cam-${i}`} position={p as [number, number, number]}>
          <boxGeometry args={[0.06, 0.04, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Trim/molding at floor transitions on sides */}
      {[0.5, 1.0, 1.5, 2.0, 2.5].map((y, i) => (
        <group key={`trim-${i}`}>
          <mesh position={[0.612, y, 0]}><boxGeometry args={[0.008, 0.02, 1.2]} /><meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} /></mesh>
          <mesh position={[-0.612, y, 0]}><boxGeometry args={[0.008, 0.02, 1.2]} /><meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} /></mesh>
        </group>
      ))}
    </group>
  )
}

/* ================================================
   Farm — Vertical Farm / Greenhouse (120+ elements)
   ================================================ */
function FarmModel() {
  const droneRef = useRef<THREE.Group>(null)
  const turbineRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (droneRef.current) {
      droneRef.current.position.x = Math.sin(t * 0.8) * 1.2
      droneRef.current.position.z = Math.cos(t * 0.8) * 1.2
      droneRef.current.position.y = 2.5 + Math.sin(t * 2) * 0.1
    }
    if (turbineRef.current) {
      const blade = turbineRef.current.getObjectByName('blade')
      if (blade) blade.rotation.z = t * 4
    }
  })

  // Living wall grid: 10x10 = 100 tiny green spheres
  const livingWall: [number, number][] = []
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) livingWall.push([r, c])

  return (
    <group>
      {/* Main greenhouse — glass structure */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[1.8, 1.6, 1.2]} />
        <meshStandardMaterial color="#a8e6a8" metalness={0.7} roughness={0.1} transparent opacity={0.45} />
      </mesh>

      {/* External steel frame — I-beam shapes on corners */}
      {[[-0.91, 0, -0.61], [0.91, 0, -0.61], [-0.91, 0, 0.61], [0.91, 0, 0.61]].map((p, i) => (
        <mesh key={`frame-${i}`} position={[p[0], 0.8, p[2]]}>
          <boxGeometry args={[0.04, 1.6, 0.04]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Horizontal frame beams at each floor */}
      {[0.3, 0.6, 0.9, 1.2, 1.5].map((y, i) => (
        <group key={`hbeam-${i}`}>
          <mesh position={[0, y, 0.62]}><boxGeometry args={[1.82, 0.025, 0.025]} /><meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} /></mesh>
          <mesh position={[0, y, -0.62]}><boxGeometry args={[1.82, 0.025, 0.025]} /><meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} /></mesh>
        </group>
      ))}

      {/* 5 Greenhouse floors with plant trays, UV lights, water pipes */}
      {[0.15, 0.4, 0.65, 0.9, 1.15].map((baseY, floorIdx) => (
        <group key={`floor-${floorIdx}`}>
          {/* Floor shelf */}
          <mesh position={[0, baseY, 0]}><boxGeometry args={[1.6, 0.02, 1.0]} /><meshStandardMaterial color="#6b7280" roughness={0.8} /></mesh>
          {/* Plant trays — 3 rows per floor, different growth stages */}
          {[-0.3, 0, 0.3].map((z, rowIdx) => {
            const growthSize = [0.03, 0.05, 0.07][rowIdx]
            return (
              <group key={`row-${rowIdx}`}>
                {Array.from({ length: 8 }).map((_, plantIdx) => (
                  <mesh key={`plant-${plantIdx}`} position={[-0.6 + plantIdx * 0.17, baseY + 0.02 + growthSize / 2, z]}>
                    <boxGeometry args={[0.08, growthSize, 0.08]} />
                    <meshStandardMaterial color={['#4ade80', '#22c55e', '#16a34a'][rowIdx]} roughness={0.8} />
                  </mesh>
                ))}
                {/* UV grow light above each row */}
                <mesh position={[0, baseY + 0.22, z]}>
                  <boxGeometry args={[1.5, 0.015, 0.02]} />
                  <meshStandardMaterial color="#9333ea" emissive="#9333ea" emissiveIntensity={1.5} />
                </mesh>
              </group>
            )
          })}
          {/* Water pipes along each floor */}
          <mesh position={[-0.75, baseY + 0.05, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.0, 6]} />
            <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Solar roof panel array — grid */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[1.82, 0.04, 1.22]} />
        <meshStandardMaterial color="#1a1a4a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Solar panel grid lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`sg-${i}`} position={[-0.65 + i * 0.26, 1.645, 0]}>
          <boxGeometry args={[0.005, 0.005, 1.2]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
      {/* Water collection tanks on roof */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`wt-${i}`} position={[x, 1.75, -0.35]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
          <meshStandardMaterial color="#60a5fa" metalness={0.4} roughness={0.4} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Water recycling pipes — external */}
      <mesh position={[-0.95, 0.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[-0.95, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Irrigation thin tubes on exterior */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`irr-${i}`} position={[0.92, 0.8, -0.4 + i * 0.2]}>
          <cylinderGeometry args={[0.008, 0.008, 1.5, 4]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Loading dock */}
      <mesh position={[0.95, 0.08, 0]}>
        <boxGeometry args={[0.12, 0.16, 0.5]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
      {/* Dock bumpers */}
      {[-0.15, 0.15].map((z, i) => (
        <mesh key={`bump-${i}`} position={[1.01, 0.1, z]}>
          <boxGeometry args={[0.03, 0.12, 0.06]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
      ))}
      {/* Roll-up door */}
      <mesh position={[0.96, 0.22, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.4]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Roll-up door lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`rd-${i}`} position={[0.975, 0.08 + i * 0.07, 0]}>
          <boxGeometry args={[0.005, 0.003, 0.38]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}

      {/* Conveyor belt at ground level */}
      <mesh position={[0.4, 0.04, 0.65]}>
        <boxGeometry args={[1.0, 0.03, 0.15]} />
        <meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Conveyor rollers */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`roller-${i}`} position={[-0.05 + i * 0.1, 0.06, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Climate control units with fan grilles */}
      {[-0.5, 0.5].map((x, i) => (
        <group key={`cc-${i}`} position={[x, 1.72, 0.4]}>
          <mesh><boxGeometry args={[0.25, 0.15, 0.2]} /><meshStandardMaterial color="#9ca3af" roughness={0.7} /></mesh>
          {/* Fan grille circles */}
          <mesh position={[0, 0, 0.105]} rotation={[-Math.PI / 2, Math.PI / 2, 0]}>
            <ringGeometry args={[0.02, 0.05, 12]} />
            <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Living wall — front side: 100 tiny green spheres */}
      {livingWall.map(([r, c]) => (
        <mesh key={`lw-${r}-${c}`} position={[-0.72 + c * 0.16, 0.12 + r * 0.14, 0.62]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial color={r % 2 === 0 ? '#22c55e' : '#16a34a'} roughness={0.9} />
        </mesh>
      ))}

      {/* Electric truck */}
      <mesh position={[1.3, 0.12, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.25]} />
        <meshStandardMaterial color="#fff" roughness={0.5} />
      </mesh>
      <mesh position={[1.15, 0.12, 0]}>
        <boxGeometry args={[0.15, 0.18, 0.23]} />
        <meshStandardMaterial color="#ddd" metalness={0.3} roughness={0.3} />
      </mesh>

      {/* Drone */}
      <group ref={droneRef} position={[0, 2.5, 0]}>
        <mesh><boxGeometry args={[0.12, 0.04, 0.12]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} /></mesh>
        {[[-0.1, 0, -0.1], [0.1, 0, -0.1], [-0.1, 0, 0.1], [0.1, 0, 0.1]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.04, 0.04, 0.005, 6]} />
            <meshStandardMaterial color="#888" transparent opacity={0.5} />
          </mesh>
        ))}
        <BlinkingLight position={[0, -0.03, 0]} color="#22c55e" speed={5} />
      </group>
      {/* Drone landing pad */}
      <mesh position={[0.6, 1.64, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Digital display panel */}
      <mesh position={[-0.92, 1.2, 0]}>
        <boxGeometry args={[0.02, 0.2, 0.35]} />
        <meshStandardMaterial color="#111827" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>

      {/* Wind turbine */}
      <group ref={turbineRef} position={[1.5, 0, -0.8]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 2, 6]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.6} />
        </mesh>
        <group name="blade" position={[0, 2, 0.05]}>
          {[0, 1, 2].map(i => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <boxGeometry args={[0.06, 0.6, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

/* ================================================
   Library — Digital Knowledge Hub (120+ elements)
   ================================================ */
function LibraryModel() {
  const holoRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (holoRef.current) {
      holoRef.current.children.forEach((child, i) => {
        child.position.y = 2.2 + Math.sin(s.clock.elapsedTime * 0.5 + i * 1.2) * 0.15
        child.rotation.y = s.clock.elapsedTime * (0.3 + i * 0.1)
      })
    }
  })

  // Curved facade — 12 angled panels
  const curvedPanels: { x: number; z: number; ry: number }[] = []
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 6 + (i / 11) * (Math.PI / 3)
    curvedPanels.push({
      x: Math.sin(angle) * 0.95,
      z: Math.cos(angle) * 0.95,
      ry: -angle,
    })
  }

  return (
    <group>
      {/* Main body */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
        <meshStandardMaterial color="#dde6f0" metalness={0.6} roughness={0.15} transparent opacity={0.7} />
      </mesh>

      {/* Curved facade — 12 angled flat panels */}
      {curvedPanels.map((p, i) => (
        <mesh key={`cv-${i}`} position={[p.x, 0.7, p.z]} rotation={[0, p.ry, 0]}>
          <boxGeometry args={[0.25, 1.35, 0.02]} />
          <meshStandardMaterial color="#c8dce8" metalness={0.7} roughness={0.1} transparent opacity={0.65} />
        </mesh>
      ))}

      {/* Wider base */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 1.6]} />
        <meshStandardMaterial color="#c0d0e0" metalness={0.5} roughness={0.2} transparent opacity={0.5} />
      </mesh>

      {/* Floor-to-ceiling windows — front, 3 floors, 4 per floor */}
      {[0.2, 0.65, 1.1].map((y, floor) =>
        [-0.6, -0.2, 0.2, 0.6].map((x, wi) => (
          <group key={`win-${floor}-${wi}`}>
            <WindowWithFrame position={[x, y, 0.71]} size={[0.3, 0.35, 0.02]} glassColor="#a0d0ff" emissive />
            {/* Bookshelves visible inside each window */}
            {[0, 1, 2].map((shelf) => (
              <group key={`shelf-${shelf}`}>
                <mesh position={[x - 0.08, y - 0.1 + shelf * 0.1, 0.68]}>
                  <boxGeometry args={[0.06, 0.025, 0.01]} />
                  <meshStandardMaterial color={['#ef4444', '#3b82f6', '#8b5cf6'][shelf]} roughness={0.7} />
                </mesh>
                <mesh position={[x + 0.04, y - 0.1 + shelf * 0.1, 0.68]}>
                  <boxGeometry args={[0.05, 0.03, 0.01]} />
                  <meshStandardMaterial color={['#22c55e', '#f59e0b', '#ec4899'][shelf]} roughness={0.7} />
                </mesh>
              </group>
            ))}
          </group>
        ))
      )}

      {/* Green roof — many small vegetation */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = -0.7 + (i % 5) * 0.35
        const z = -0.5 + Math.floor(i / 5) * 0.25
        return (
          <mesh key={`gr-${i}`} position={[x, 1.42 + Math.random() * 0.05, z]}>
            <sphereGeometry args={[0.06 + Math.random() * 0.04, 5, 5]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#16a34a' : '#4ade80'} roughness={0.9} />
          </mesh>
        )
      })}

      {/* Grand staircase at entrance — 8 steps */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={`step-${i}`}>
          <mesh position={[0, -0.02 + i * 0.03, 0.85 + i * 0.04]}>
            <boxGeometry args={[1.0 - i * 0.02, 0.025, 0.04]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          {/* Step edge detail */}
          <mesh position={[0, -0.005 + i * 0.03, 0.87 + i * 0.04]}>
            <boxGeometry args={[1.0 - i * 0.02, 0.005, 0.005]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Entrance columns */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 0.3, 0.78]}>
          <cylinderGeometry args={[0.05, 0.06, 0.6, 8]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.7} />
        </mesh>
      ))}

      {/* Reading pods on terraces — small capsule shapes */}
      {[-0.3, 0.1, 0.4].map((x, i) => (
        <mesh key={`pod-${i}`} position={[x, 1.52, 0.5]}>
          <capsuleGeometry args={[0.06, 0.08, 4, 6]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.5} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Digital media wall — grid of small screens */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = -0.8 + (i % 5) * 0.4
        const y = 0.4 + Math.floor(i / 5) * 0.25
        const colors = ['#0ea5e9', '#8b5cf6', '#22d3ee', '#f59e0b', '#ef4444']
        return (
          <mesh key={`screen-${i}`} position={[x, y, -0.72]}>
            <boxGeometry args={[0.12, 0.1, 0.01]} />
            <meshStandardMaterial color={colors[i % 5]} emissive={colors[i % 5]} emissiveIntensity={0.8} />
          </mesh>
        )
      })}

      {/* E-ink facade panels — side */}
      {[0.3, 0.7, 1.1].map((y, i) => (
        <mesh key={`eink-${i}`} position={[0.92, y, 0]}>
          <boxGeometry args={[0.02, 0.25, 0.8]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#334155" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* Floating holographic books/screens */}
      <group ref={holoRef}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[Math.sin(i * 1.5) * 0.5, 2.2, Math.cos(i * 1.5) * 0.5]}>
            <boxGeometry args={[0.15, 0.2, 0.02]} />
            <meshStandardMaterial color={['#0ea5e9', '#8b5cf6', '#22d3ee', '#a78bfa'][i]} emissive={['#0ea5e9', '#8b5cf6', '#22d3ee', '#a78bfa'][i]} emissiveIntensity={1.2} transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Reading terrace */}
      <mesh position={[0.5, 1.42, 0.5]}><boxGeometry args={[0.8, 0.03, 0.4]} /><meshStandardMaterial color="#8b7355" roughness={0.8} /></mesh>
      <mesh position={[0.4, 1.48, 0.5]}><boxGeometry args={[0.08, 0.06, 0.08]} /><meshStandardMaterial color="#654321" roughness={0.8} /></mesh>
      <mesh position={[0.6, 1.48, 0.5]}><boxGeometry args={[0.08, 0.06, 0.08]} /><meshStandardMaterial color="#654321" roughness={0.8} /></mesh>

      {/* Bicycle parking — thin wire frames */}
      <group position={[-0.8, 0.06, 0.85]}>
        {[0, 0.12, 0.24].map((x, i) => (
          <group key={`bike-${i}`} position={[x, 0, 0]}>
            <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[0.06, 0.003, 4, 12, Math.PI]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, -0.03, 0]}>
              <cylinderGeometry args={[0.003, 0.003, 0.06, 4]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Water feature at entrance */}
      <mesh position={[0, 0.01, 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 12]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.8} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.12, 1.15]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#93c5fd" emissive="#0ea5e9" emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>

      {/* Satellite dish on roof */}
      <mesh position={[0.6, 1.55, -0.4]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0, 0.15, 0.08, 8]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cell tower */}
      <mesh position={[-0.6, 1.7, -0.4]}>
        <cylinderGeometry args={[0.015, 0.02, 0.5, 4]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      <BlinkingLight position={[-0.6, 1.96, -0.4]} color="#ff0000" speed={2} />

      {/* Coffee shop warm light */}
      <mesh position={[-0.6, 0.2, 0.72]}>
        <boxGeometry args={[0.4, 0.35, 0.02]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} transparent opacity={0.5} />
      </mesh>

      {/* Fiber optic cables to ground */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={`fiber-${i}`} position={[x, -0.2, 0.7]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 4]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
        </mesh>
      ))}

      {/* Digital signage */}
      <mesh position={[0, 1.2, 0.72]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#111827" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/* ================================================
   Lab — AI Research Center (130+ elements)
   ================================================ */
function LabModel() {
  const radarRef = useRef<THREE.Group>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (radarRef.current) radarRef.current.rotation.y = t * 0.8
    if (ring1Ref.current) ring1Ref.current.rotation.y = t * 0.5
    if (ring2Ref.current) ring2Ref.current.rotation.y = -t * 0.3
    if (ring3Ref.current) ring3Ref.current.rotation.y = t * 0.7
  })

  // 16-sided polygon wall panels
  const wallPanels: { x: number; z: number; ry: number }[] = []
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2
    wallPanels.push({
      x: Math.sin(angle) * 0.75,
      z: Math.cos(angle) * 0.75,
      ry: -angle,
    })
  }

  // Quantum computing lattice — small spheres connected
  const quantumNodes: [number, number, number][] = []
  for (let x = -2; x <= 2; x++) {
    for (let y = -2; y <= 2; y++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= 3) {
          quantumNodes.push([x * 0.04, y * 0.04, z * 0.04])
        }
      }
    }
  }

  return (
    <group>
      {/* Main cylindrical tower */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 2.4, 16]} />
        <meshStandardMaterial color="#e0eef8" metalness={0.7} roughness={0.15} transparent opacity={0.75} />
      </mesh>

      {/* 16 wall panels with varied instrumentation */}
      {wallPanels.map((p, i) => (
        <group key={`wp-${i}`} position={[p.x, 1.2, p.z]} rotation={[0, p.ry, 0]}>
          <mesh>
            <boxGeometry args={[0.3, 2.3, 0.02]} />
            <meshStandardMaterial color="#d0dde8" metalness={0.6} roughness={0.2} transparent opacity={0.6} />
          </mesh>
          {/* Varied instrumentation per panel */}
          {i % 4 === 0 && (
            /* Vent panels */
            <group>
              {Array.from({ length: 4 }).map((_, vi) => (
                <mesh key={`vent-${vi}`} position={[0, -0.6 + vi * 0.15, 0.015]}>
                  <boxGeometry args={[0.2, 0.008, 0.005]} />
                  <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.5} />
                </mesh>
              ))}
            </group>
          )}
          {i % 4 === 1 && (
            /* Screen panel */
            <mesh position={[0, 0.2, 0.015]}>
              <boxGeometry args={[0.18, 0.12, 0.005]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.6} />
            </mesh>
          )}
          {i % 4 === 2 && (
            /* Window for quantum core visibility */
            <mesh position={[0, 0, 0.015]}>
              <boxGeometry args={[0.2, 0.5, 0.005]} />
              <meshStandardMaterial color="#a0d0ff" metalness={0.9} roughness={0.05} transparent opacity={0.4} />
            </mesh>
          )}
        </group>
      ))}

      {/* Rotating rings — animated */}
      <mesh ref={ring1Ref} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.85, 0.03, 8, 32]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 1.4, 0]}>
        <torusGeometry args={[0.9, 0.03, 8, 32]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring3Ref} position={[0, 2.0, 0]}>
        <torusGeometry args={[0.85, 0.03, 8, 32]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Quantum computing core — glowing lattice */}
      <group position={[0, 1.2, 0]}>
        <mesh>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} transparent opacity={0.4} />
        </mesh>
        {/* Lattice nodes */}
        {quantumNodes.map((p, i) => (
          <mesh key={`qn-${i}`} position={p}>
            <sphereGeometry args={[0.008, 4, 4]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
          </mesh>
        ))}
        {/* Connecting cylinders (subset — connect to center) */}
        {quantumNodes.filter((_, i) => i % 3 === 0).map((p, i) => {
          const len = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2)
          if (len < 0.01) return null
          return (
            <mesh key={`qc-${i}`} position={[p[0] / 2, p[1] / 2, p[2] / 2]}
              rotation={[Math.atan2(Math.sqrt(p[0] ** 2 + p[2] ** 2), p[1]) + Math.PI / 2, 0, Math.atan2(p[0], p[2])]}
            >
              <cylinderGeometry args={[0.002, 0.002, len, 3]} />
              <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={2} transparent opacity={0.6} />
            </mesh>
          )
        })}
      </group>

      {/* Robotic arm visible */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={`arm-${i}`} position={[Math.cos(angle) * 0.55, 0.6, Math.sin(angle) * 0.55]} rotation={[0, -angle, 0]}>
          {/* Base joint */}
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.04, 6]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Upper arm */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Elbow joint */}
          <mesh position={[0, 0.13, 0]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, 0.2, 0.02]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.03, 0.12, 0.03]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Clean room entrance: airlock with 2 doors + warning stripes */}
      <mesh position={[-0.08, 0.25, 0.82]}>
        <boxGeometry args={[0.3, 0.5, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.25, 0.88]}>
        <boxGeometry args={[0.3, 0.5, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Warning stripes — yellow/black */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`ws-${i}`} position={[-0.22 + i * 0.06, 0.02, 0.85]}>
          <boxGeometry args={[0.03, 0.04, 0.06]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#eab308' : '#1f2937'} />
        </mesh>
      ))}

      {/* Exhaust stacks — 4 thin chimneys */}
      {[[-0.25, 0], [0.25, 0], [0, -0.25], [0, 0.25]].map(([dx, dz], i) => (
        <group key={`exh-${i}`}>
          <mesh position={[dx, 2.55, dz]}>
            <cylinderGeometry args={[0.04, 0.05, 0.3, 6]} />
            <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Vapor */}
          <mesh position={[dx, 2.8, dz]}>
            <sphereGeometry args={[0.04, 5, 5]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Chemical storage tanks */}
      {[[-0.9, 0.3, 0.3], [-0.9, 0.3, -0.3]].map((p, i) => (
        <mesh key={`tank-${i}`} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Transformer station */}
      <group position={[0.9, 0.15, -0.6]}>
        <mesh><boxGeometry args={[0.3, 0.3, 0.25]} /><meshStandardMaterial color="#4b5563" metalness={0.4} roughness={0.6} /></mesh>
        {/* Cooling fins */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`fin-${i}`} position={[0.16, -0.1 + i * 0.06, 0]}>
            <boxGeometry args={[0.005, 0.05, 0.22]} />
            <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Backup generator */}
      <mesh position={[0.9, 0.1, 0.5]}>
        <boxGeometry args={[0.25, 0.2, 0.2]} />
        <meshStandardMaterial color="#374151" metalness={0.4} roughness={0.7} />
      </mesh>

      {/* Anti-static flooring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.95} />
      </mesh>

      {/* Radar dome on top */}
      <group ref={radarRef} position={[0, 2.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.3} transparent opacity={0.7} />
        </mesh>
        {/* Wireframe cross-lines on dome surface */}
        {[0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4].map((ry, i) => (
          <mesh key={`dl-${i}`} position={[0, 0.09, 0]} rotation={[0, ry, 0]}>
            <boxGeometry args={[0.35, 0.003, 0.003]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 4]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Warning lights */}
      <BlinkingLight position={[0.7, 0.5, 0]} color="#eab308" speed={2} />
      <BlinkingLight position={[-0.7, 0.5, 0]} color="#eab308" speed={2} />

      {/* Laser beams between posts */}
      {[[-0.8, 0.3, 0.8], [0.8, 0.3, 0.8]].map((p, i) => (
        <mesh key={`post-${i}`} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
          <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Red laser beam */}
      <mesh position={[0, 0.4, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 1.6, 4]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      {/* Green laser beam */}
      <mesh position={[0, 0.5, 0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 1.6, 4]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}

/* ================================================
   Server — Data Center (140+ elements)
   ================================================ */
function ServerModel() {
  const serverLightsRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (serverLightsRef.current) {
      serverLightsRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        const phase = s.clock.elapsedTime * 3 + i * 0.7
        const hue = (phase % 6.28) / 6.28
        const r = Math.sin(hue * 6.28) * 0.5 + 0.5
        const g = Math.sin(hue * 6.28 + 2.09) * 0.5 + 0.5
        const b = Math.sin(hue * 6.28 + 4.19) * 0.5 + 0.5
        mat.emissive.setRGB(r, g, b)
        mat.emissiveIntensity = 1.5 + Math.sin(phase) * 0.5
      })
    }
  })

  return (
    <group>
      {/* 3 modular building segments */}
      {[-0.6, 0, 0.6].map((x, seg) => (
        <group key={`seg-${seg}`}>
          <mesh castShadow position={[x, 0.5, 0]}>
            <boxGeometry args={[0.7, 1, 1.2]} />
            <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.8} />
          </mesh>
          {/* Segment joint lines */}
          {seg < 2 && (
            <mesh position={[x + 0.35, 0.5, 0]}>
              <boxGeometry args={[0.01, 1.0, 1.22]} />
              <meshStandardMaterial color="#2d3748" roughness={0.9} />
            </mesh>
          )}
          {/* Cooling tower per segment */}
          <mesh position={[x, 1.15, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.3, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.6} />
          </mesh>
          <SpinningFan position={[x, 1.35, 0]} speed={3 + seg} />
          {/* Narrow windows per segment */}
          {[-0.2, 0.2].map((z, wi) => (
            <mesh key={`sw-${wi}`} position={[x, 0.6, z + 0.61]}>
              <boxGeometry args={[0.4, 0.1, 0.01]} />
              <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Server rack LEDs visible through windows — many colored rectangles */}
      <group ref={serverLightsRef}>
        {Array.from({ length: 30 }).map((_, i) => {
          const seg = Math.floor(i / 10)
          const row = Math.floor((i % 10) / 5)
          const col = i % 5
          return (
            <mesh key={`led-${i}`} position={[-0.8 + seg * 0.6 + col * 0.08, 0.3 + row * 0.25, 0.612]}>
              <boxGeometry args={[0.03, 0.015, 0.008]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
            </mesh>
          )
        })}
      </group>

      {/* Cable trays on exterior walls */}
      {[-0.3, 0.3].map((z, i) => (
        <group key={`ct-${i}`}>
          <mesh position={[0, 0.8, z - 0.62]}>
            <boxGeometry args={[2.0, 0.06, 0.08]} />
            <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Cable management channel detail */}
          {Array.from({ length: 8 }).map((_, j) => (
            <mesh key={`cable-${j}`} position={[-0.8 + j * 0.25, 0.82, z - 0.625]}>
              <boxGeometry args={[0.015, 0.005, 0.04]} />
              <meshStandardMaterial color="#374151" roughness={0.7} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Walkway on roof with safety railings */}
      <mesh position={[0, 1.05, 0.4]}>
        <boxGeometry args={[2.2, 0.04, 0.15]} />
        <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Railing posts */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`rp-${i}`} position={[-1.0 + i * 0.18, 1.15, 0.47]}>
          <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 1.25, 0.47]}>
        <boxGeometry args={[2.2, 0.01, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Mid rail */}
      <mesh position={[0, 1.15, 0.47]}>
        <boxGeometry args={[2.2, 0.01, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Concrete jersey barriers around perimeter */}
      {[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => (
        <mesh key={`barrier-${i}`} position={[x, 0.08, 0.8]}>
          <boxGeometry args={[0.15, 0.16, 0.35]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.9} />
        </mesh>
      ))}

      {/* Diesel generators — 2 units */}
      {[-1.2, -0.8].map((x, i) => (
        <group key={`gen-${i}`}>
          <mesh position={[x, 0.15, -0.5]}>
            <boxGeometry args={[0.3, 0.3, 0.25]} />
            <meshStandardMaterial color="#555" metalness={0.4} roughness={0.7} />
          </mesh>
          {/* Exhaust stack */}
          <mesh position={[x, 0.4, -0.5]}>
            <cylinderGeometry args={[0.025, 0.03, 0.2, 6]} />
            <meshStandardMaterial color="#666" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Fuel tank */}
          <mesh position={[x + 0.2, 0.08, -0.5]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 6]} />
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Loading dock with truck bay and ramp */}
      <mesh position={[1.2, 0.05, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.6]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
      {/* Ramp */}
      <mesh position={[1.4, 0.02, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.2, 0.03, 0.55]} />
        <meshStandardMaterial color="#6b7280" roughness={0.9} />
      </mesh>

      {/* Fiber optic entry point — thick cable bundle */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={`fib-${i}`} position={[x, -0.1, 0.65]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} />
        </mesh>
      ))}

      {/* Fire suppression indicators — red boxes on walls */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={`fire-${i}`} position={[x, 0.8, 0.615]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
      ))}

      {/* Security cameras on poles */}
      {[-1.0, 1.0].map((x, i) => (
        <group key={`seccam-${i}`}>
          <mesh position={[x, 0.6, 0.7]}>
            <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.82, 0.72]}>
            <boxGeometry args={[0.05, 0.03, 0.06]} />
            <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Anti-vehicle bollards */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`bollard-${i}`} position={[-1.0 + i * 0.3, 0.08, 0.9]}>
          <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.7} />
        </mesh>
      ))}

      {/* Security fence perimeter */}
      {[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => (
        <mesh key={`fp-${i}`} position={[x, 0.3, -0.75]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.4, -0.75]}><boxGeometry args={[2.6, 0.01, 0.01]} /><meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} /></mesh>
      <mesh position={[0, 0.55, -0.75]}><boxGeometry args={[2.6, 0.01, 0.01]} /><meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} /></mesh>

      {/* LED Status display */}
      <Billboard position={[0, 0.85, 0.62]}>
        <Text fontSize={0.08} color="#22c55e" anchorX="center" anchorY="middle">
          ● ONLINE — 99.99% UPTIME
        </Text>
      </Billboard>

      {/* UPS indicator */}
      <mesh position={[-1, 0.2, 0.55]}>
        <boxGeometry args={[0.2, 0.15, 0.08]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <BlinkingLight position={[-1, 0.32, 0.6]} color="#22c55e" speed={1} />

      {/* Badge reader at door */}
      <mesh position={[0.15, 0.4, 0.615]}>
        <boxGeometry args={[0.05, 0.08, 0.02]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <BlinkingLight position={[0.15, 0.46, 0.62]} color="#22c55e" speed={0.5} />
    </group>
  )
}

/* ================================================
   Barracks — Agent Training Academy (120+ elements)
   ================================================ */
function BarracksModel() {
  const flagRef = useRef<THREE.Mesh>(null)
  const flag2Ref = useRef<THREE.Mesh>(null)
  const flag3Ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (flagRef.current) flagRef.current.rotation.z = Math.sin(t * 2) * 0.15
    if (flag2Ref.current) flag2Ref.current.rotation.z = Math.sin(t * 2.1 + 0.5) * 0.12
    if (flag3Ref.current) flag3Ref.current.rotation.z = Math.sin(t * 1.9 + 1) * 0.1
  })

  return (
    <group>
      {/* Main 2-story building */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 1, 1.5]} />
        <meshStandardMaterial color="#44403c" metalness={0.2} roughness={0.85} />
      </mesh>

      {/* Wall panel detail lines */}
      {[0.15, 0.5, 0.85].map((y, i) => (
        <PanelLine key={`wpl-${i}`} position={[0, y, 0.76]} size={[1.98, 0.008, 0.008]} color="#3a3632" />
      ))}

      {/* Detailed window arrangement — 2 floors, 5 per floor */}
      {[0.3, 0.7].map((y, floor) =>
        [-0.7, -0.35, 0, 0.35, 0.7].map((x, wi) => (
          <WindowWithFrame key={`bw-${floor}-${wi}`} position={[x, y, 0.76]} size={[0.18, 0.22, 0.02]} glassColor="#b0c4d8" />
        ))
      )}

      {/* VR simulation pods — 4 */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <group key={`vr-${i}`} position={[x, 0.3, 0.5]}>
          <mesh>
            <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
            <meshStandardMaterial color="#b0d0e8" metalness={0.7} roughness={0.1} transparent opacity={0.5} />
          </mesh>
          {/* Figure inside */}
          <mesh>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} />
          </mesh>
          {/* VR headset shape */}
          <mesh position={[0, 0.06, 0.04]}>
            <boxGeometry args={[0.06, 0.025, 0.025]} />
            <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Outdoor training area */}
      {/* Monkey bars */}
      <group position={[-0.5, 0.02, -1]}>
        {/* Posts */}
        {[-0.3, 0.3].map((x, pi) => (
          <group key={`mbp-${pi}`}>
            <mesh position={[x, 0.3, -0.15]}><cylinderGeometry args={[0.015, 0.015, 0.6, 4]} /><meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} /></mesh>
            <mesh position={[x, 0.3, 0.15]}><cylinderGeometry args={[0.015, 0.015, 0.6, 4]} /><meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} /></mesh>
          </group>
        ))}
        {/* Rungs */}
        {Array.from({ length: 6 }).map((_, ri) => (
          <mesh key={`rung-${ri}`} position={[-0.25 + ri * 0.1, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.3, 4]} />
            <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {/* Top bar */}
        <mesh position={[0, 0.6, -0.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
          <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.6, 0.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
          <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>

      {/* Wall climb */}
      <mesh position={[0.3, 0.25, -1]}>
        <boxGeometry args={[0.5, 0.5, 0.08]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
      {/* Climbing holds */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`hold-${i}`} position={[0.12 + (i % 4) * 0.12, 0.08 + Math.floor(i / 4) * 0.15, -0.955]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshStandardMaterial color={['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i % 4]} roughness={0.8} />
        </mesh>
      ))}

      {/* Rope climb */}
      <group position={[0.7, 0, -1]}>
        <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.015, 0.015, 0.7, 4]} /><meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.4} /></mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.6, 4]} />
          <meshStandardMaterial color="#a16207" roughness={0.9} />
        </mesh>
      </group>

      {/* Indoor gym visible through windows — silhouettes */}
      <mesh position={[-0.7, 0.2, -0.3]}>
        <boxGeometry args={[0.15, 0.3, 0.1]} />
        <meshStandardMaterial color="#555" roughness={0.8} />
      </mesh>
      {/* Treadmill */}
      <mesh position={[-0.5, 0.12, -0.3]}>
        <boxGeometry args={[0.12, 0.08, 0.2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.2, -0.35]}>
        <boxGeometry args={[0.02, 0.12, 0.02]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} />
      </mesh>

      {/* Briefing room screen */}
      <mesh position={[0, 0.8, -0.76]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color="#1e293b" emissive="#334155" emissiveIntensity={0.5} />
      </mesh>
      {/* Seat rows */}
      {[-0.2, 0, 0.2].map((x, i) =>
        [-0.5, -0.3].map((z, j) => (
          <mesh key={`seat-${i}-${j}`} position={[x, 0.55, z]}>
            <boxGeometry args={[0.08, 0.06, 0.06]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Simulation room — holographic display */}
      <GlowingPanel position={[0.7, 0.7, 0]} size={[0.02, 0.4, 0.6]} color="#8b5cf6" opacity={0.3} />

      {/* Armory — reinforced door with red light */}
      <mesh position={[-0.85, 0.3, -0.76]}>
        <boxGeometry args={[0.3, 0.5, 0.03]} />
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Door reinforcement bars */}
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={`dr-${i}`} position={[-0.85 + x, 0.3, -0.775]}>
          <boxGeometry args={[0.02, 0.48, 0.005]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <BlinkingLight position={[-0.85, 0.6, -0.78]} color="#ef4444" speed={1.5} />

      {/* Drone launch pad */}
      <mesh position={[0.7, 1.02, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
      {/* Pad markings */}
      <mesh position={[0.7, 1.025, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 12]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} transparent opacity={0.5} />
      </mesh>

      {/* Helipad on roof */}
      <mesh position={[-0.3, 1.02, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 12]} />
        <meshStandardMaterial color="#404040" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 1.025, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Communication tower + dish */}
      <mesh position={[-0.8, 1.2, 0.5]}>
        <cylinderGeometry args={[0.02, 0.04, 1.4, 4]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, 1.95, 0.5]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0, 0.12, 0.06, 6]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
      </mesh>
      <BlinkingLight position={[-0.8, 2.0, 0.5]} color="#ff0000" speed={2} />

      {/* 3 Flagpoles with animated flags */}
      {[0.7, 0.85, 1.0].map((x, i) => (
        <group key={`flag-${i}`}>
          <mesh position={[x, 0.9, 0.7]}>
            <cylinderGeometry args={[0.012, 0.015, 1.8, 4]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh ref={i === 0 ? flagRef : i === 1 ? flag2Ref : flag3Ref} position={[x, 1.65, 0.8]}>
            <boxGeometry args={[0.02, 0.18, 0.22]} />
            <meshStandardMaterial color={['#ef4444', '#3b82f6', '#22c55e'][i]} roughness={0.6} />
          </mesh>
          {/* Flag pole tip */}
          <mesh position={[x, 1.81, 0.7]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Trophy case in lobby window */}
      <mesh position={[0.5, 0.25, 0.77]}>
        <boxGeometry args={[0.25, 0.2, 0.02]} />
        <meshStandardMaterial color="#a0d0ff" metalness={0.9} roughness={0.05} transparent opacity={0.5} />
      </mesh>
      {/* Trophies */}
      {[0, 0.06, 0.12].map((x, i) => (
        <mesh key={`trophy-${i}`} position={[0.43 + x, 0.22, 0.75]}>
          <cylinderGeometry args={[0.01, 0.015, 0.04, 4]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Parking area — 2 vehicle shapes */}
      {[0, 0.6].map((x, i) => (
        <group key={`car-${i}`} position={[-0.9 + x, 0.02, -1.2]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.35, 0.1, 0.18]} />
            <meshStandardMaterial color={['#374151', '#64748b'][i]} metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0.02, 0.13, 0]}>
            <boxGeometry args={[0.18, 0.07, 0.16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.2} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Obstacle course hurdles */}
      {[-0.8, -0.5, -0.2, 0.1].map((x, i) => (
        <mesh key={`hurdle-${i}`} position={[x, 0.06, -1]}>
          <boxGeometry args={[0.08, 0.12 + i * 0.08, 0.08]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================
   Building model selector
   ================================================ */
function BuildingModel({ type }: { type: string }) {
  switch (type) {
    case 'hq': return <HQModel />
    case 'farm': return <FarmModel />
    case 'library': return <LibraryModel />
    case 'lab': return <LabModel />
    case 'server': return <ServerModel />
    case 'barracks': return <BarracksModel />
    default: return (
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#64748b" roughness={0.5} />
      </mesh>
    )
  }
}

/* ================================================
   Draggable Building wrapper (for edit mode)
   ================================================ */
export function Building({ building }: { building: BuildingType }) {
  const groupRef = useRef<THREE.Group>(null)
  const { selectedBuildingId, setSelectedBuilding, editMode, updateBuildingPosition, updateBuildingRotation, deleteBuilding } = useGameStore()
  const isSelected = selectedBuildingId === building.id
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<THREE.Vector3>(new THREE.Vector3())
  const initialPos = useRef<[number, number, number]>([0, 0, 0])
  const { raycaster, camera } = useThree()

  const template = BUILDING_TEMPLATES.find(t => t.type === building.type)
  const isUnderConstruction = building.status === 'under_construction'
  const isPlanned = building.status === 'planned'

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!editMode) {
      e.stopPropagation()
      setSelectedBuilding(building.id)
      return
    }
    e.stopPropagation()
    setIsDragging(true)
    setSelectedBuilding(building.id)
    dragStart.current.copy(e.point)
    initialPos.current = [...building.position]
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId)
  }, [editMode, building.id, building.position, setSelectedBuilding])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !editMode) return
    e.stopPropagation()
    const delta = e.point.clone().sub(dragStart.current)
    const snap = (v: number) => Math.round(v * 2) / 2
    const newX = snap(initialPos.current[0] + delta.x)
    const newZ = snap(initialPos.current[2] + delta.z)
    updateBuildingPosition(building.id, [newX, 0, newZ])
  }, [isDragging, editMode, building.id, updateBuildingPosition])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editMode && isSelected && e.key.toLowerCase() === 'r') {
      updateBuildingRotation(building.id, building.rotation + Math.PI / 2)
    }
  }, [editMode, isSelected, building.id, building.rotation, updateBuildingRotation])

  useState(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  })

  return (
    <group
      ref={groupRef}
      position={building.position}
      rotation={[0, building.rotation, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setIsDragging(false) }}
    >
      {editMode && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.5, 2.5, 2.5]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={hovered ? 0.4 : 0.15} transparent opacity={0.08} wireframe />
        </mesh>
      )}

      {isPlanned && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#64748b" transparent opacity={0.2} wireframe />
        </mesh>
      )}

      <group scale={isPlanned ? [0.6, 0.6, 0.6] : [1, 1, 1]}>
        <BuildingModel type={building.type} />
      </group>

      {isUnderConstruction && (
        <group position={[0, 2.5, 0]}>
          <mesh><boxGeometry args={[1, 0.08, 0.02]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[-(1 - building.constructionProgress / 100) * 0.5, 0, 0.01]}>
            <boxGeometry args={[building.constructionProgress / 100, 0.06, 0.02]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      <Billboard position={[0, (building.type === 'hq' ? 4 : 2.2), 0]}>
        <Text fontSize={0.14} color={isSelected ? '#0ea5e9' : '#e2e8f0'} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0f172a">
          {template?.emoji || '🏗️'} {building.name}
        </Text>
      </Billboard>

      <Billboard position={[0, (building.type === 'hq' ? 3.7 : 1.95), 0]}>
        <Text fontSize={0.09} color={building.status === 'active' ? '#22c55e' : building.status === 'under_construction' ? '#eab308' : '#64748b'} anchorX="center" anchorY="middle">
          {building.status === 'active' ? '● Active' : building.status === 'under_construction' ? '◐ Building...' : '○ Planned'}
        </Text>
      </Billboard>

      <Billboard position={[0.8, (building.type === 'hq' ? 3.7 : 1.95), 0]}>
        <Text fontSize={0.1} color="#94a3b8" anchorX="center" anchorY="middle">
          Lv.{building.level}
        </Text>
      </Billboard>

      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      )}

      {editMode && hovered && building.type !== 'hq' && (
        <Billboard position={[1.2, 2, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); deleteBuilding(building.id) }}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Text fontSize={0.12} color="#fff" anchorX="center" anchorY="middle" position={[0, 0, 0.01]}>
            ✕
          </Text>
        </Billboard>
      )}
    </group>
  )
}
