'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, type EnvironmentObject } from '@/store/gameStore'

/* =============================================
   Environment object models — improved detail
   ============================================= */
function ModernTree({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Modern planter base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.3, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Soil visible */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 8]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.95} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Visible branches — thin cylinders radiating from trunk */}
      {[
        { pos: [0.15, 1.0, 0.05] as [number, number, number], rot: [0, 0, -0.8] as [number, number, number], len: 0.3 },
        { pos: [-0.12, 0.9, 0.1] as [number, number, number], rot: [0.3, 0, 0.7] as [number, number, number], len: 0.25 },
        { pos: [0.05, 1.1, -0.15] as [number, number, number], rot: [-0.5, 0, -0.5] as [number, number, number], len: 0.28 },
        { pos: [-0.1, 1.15, -0.05] as [number, number, number], rot: [0.2, 0, 0.6] as [number, number, number], len: 0.22 },
        { pos: [0.08, 0.85, 0.12] as [number, number, number], rot: [0.4, 0, -0.6] as [number, number, number], len: 0.2 },
        { pos: [-0.06, 1.05, 0.08] as [number, number, number], rot: [0.3, 0.4, 0.4] as [number, number, number], len: 0.18 },
      ].map((b, i) => (
        <mesh key={`branch-${i}`} position={b.pos} rotation={b.rot}>
          <cylinderGeometry args={[0.015, 0.025, b.len, 4]} />
          <meshStandardMaterial color="#5c2d0a" roughness={0.9} />
        </mesh>
      ))}
      {/* Canopy - layered spheres */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} />
      </mesh>
      <mesh position={[0.2, 1.5, 0.1]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.85} />
      </mesh>
      <mesh position={[-0.15, 1.45, -0.1]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 1.15, 0.2]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshStandardMaterial color="#4ade80" roughness={0.85} />
      </mesh>
      <mesh position={[-0.2, 1.2, 0.15]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat — multiple slats */}
      {[-0.08, -0.03, 0.02, 0.07].map((z, i) => (
        <mesh key={`slat-${i}`} position={[0, 0.25, z]}>
          <boxGeometry args={[0.6, 0.025, 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
      ))}
      {/* Back — multiple slats */}
      {[0, 0.06, 0.12].map((dy, i) => (
        <mesh key={`bslat-${i}`} position={[0, 0.32 + dy, -0.09]}>
          <boxGeometry args={[0.6, 0.04, 0.02]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
      ))}
      {/* Armrests */}
      {[-0.27, 0.27].map((x, i) => (
        <mesh key={`arm-${i}`} position={[x, 0.38, -0.02]}>
          <boxGeometry args={[0.03, 0.03, 0.14]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      {/* Legs — 4 with cross bracing */}
      {[-0.25, 0.25].map((x, i) => (
        <group key={`legset-${i}`}>
          <mesh position={[x, 0.12, -0.08]}>
            <boxGeometry args={[0.025, 0.25, 0.025]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[x, 0.12, 0.06]}>
            <boxGeometry args={[0.025, 0.25, 0.025]} />
            <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Cross brace */}
          <mesh position={[x, 0.08, -0.01]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.015, 0.005, 0.12]} />
            <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function StreetLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + Math.sin(s.clock.elapsedTime * 0.5) * 0.2
    }
  })
  return (
    <group position={position}>
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 6]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Taller pole (0.6 height as specified) */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.02, 0.035, 0.6, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Arm — curved */}
      <mesh position={[0.1, 0.6, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.012, 0.018, 0.25, 4]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lamp head — cone + sphere */}
      <mesh position={[0.2, 0.68, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.06, 0.05, 6]} />
        <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Light globe */}
      <mesh ref={lightRef} position={[0.2, 0.63, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
      </mesh>
      {/* Light cone (subtle glow) */}
      <mesh position={[0.2, 0.35, 0]}>
        <coneGeometry args={[0.3, 0.55, 8, 1, true]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.03} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function EVCharger({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.5 + Math.sin(s.clock.elapsedTime * 2) * 0.5
    }
  })
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.9, 0.15]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.6, 0.08]}>
        <boxGeometry args={[0.12, 0.15, 0.01]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.25, 0.1]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <mesh ref={ref} position={[0, 0.85, 0.08]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

function Bush({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.12, 0.05]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Planter({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.18, 6, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} />
      </mesh>
      <mesh position={[0.05, 0.4, 0.05]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#4ade80" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Car({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.25]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.02, 0.24, 0]}>
        <boxGeometry args={[0.25, 0.12, 0.22]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {[[-0.15, 0.04, 0.13], [-0.15, 0.04, -0.13], [0.15, 0.04, 0.13], [0.15, 0.04, -0.13]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.26, 0.14, 0.08]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.26, 0.14, -0.08]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

/* =============================================
   Environment object renderer
   ============================================= */
function EnvironmentItem({ obj }: { obj: EnvironmentObject }) {
  switch (obj.type) {
    case 'tree': return <ModernTree position={obj.position} rotation={obj.rotation} />
    case 'bench': return <Bench position={obj.position} rotation={obj.rotation} />
    case 'streetlight': return <StreetLight position={obj.position} />
    case 'ev_charger': return <EVCharger position={obj.position} rotation={obj.rotation} />
    case 'bush': return <Bush position={obj.position} rotation={obj.rotation} />
    case 'planter': return <Planter position={obj.position} rotation={obj.rotation} />
    case 'car': return <Car position={obj.position} rotation={obj.rotation} />
    default: return null
  }
}

/* =============================================
   Pond with fountain
   ============================================= */
function Pond() {
  const jetRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (jetRef.current) {
      jetRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        mesh.position.y = 0.3 + Math.abs(Math.sin(s.clock.elapsedTime * 3 + i * 0.5)) * 0.4
        mesh.scale.y = 1 + Math.sin(s.clock.elapsedTime * 4 + i) * 0.3
      })
    }
  })
  return (
    <group position={[-6, 0, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 24]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <group ref={jetRef}>
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[Math.sin(i * 2.1) * 0.2, 0.3, Math.cos(i * 2.1) * 0.2]}>
            <cylinderGeometry args={[0.015, 0.005, 0.4, 4]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.12, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* =============================================
   Asphalt paths with crosswalk markings
   ============================================= */
function Paths() {
  return (
    <group>
      {/* Main east-west path */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 0.8]} />
        <meshStandardMaterial color="#374151" roughness={0.95} />
      </mesh>
      {/* Main north-south path */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[20, 0.8]} />
        <meshStandardMaterial color="#374151" roughness={0.95} />
      </mesh>
      {/* Diagonal paths */}
      <mesh position={[3, 0.015, 3]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[8, 0.5]} />
        <meshStandardMaterial color="#4b5563" roughness={0.95} />
      </mesh>
      <mesh position={[-3, 0.015, -3]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[8, 0.5]} />
        <meshStandardMaterial color="#4b5563" roughness={0.95} />
      </mesh>
      {/* Center line dashes — east-west */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={`cl-${i}`} position={[-9.5 + i, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
      ))}

      {/* Crosswalk markings at intersection */}
      {/* North crosswalk */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`cw-n-${i}`} position={[-0.3 + i * 0.12, 0.02, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      ))}
      {/* South crosswalk */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`cw-s-${i}`} position={[-0.3 + i * 0.12, 0.02, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      ))}
      {/* East crosswalk */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`cw-e-${i}`} position={[0.55, 0.02, -0.3 + i * 0.12]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.08, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      ))}
      {/* West crosswalk */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`cw-w-${i}`} position={[-0.55, 0.02, -0.3 + i * 0.12]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.08, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/* =============================================
   Ground detail: manhole covers and drain grates
   ============================================= */
function GroundDetails() {
  return (
    <group>
      {/* Manhole covers — thin dark circles on paths */}
      {[
        [2, 0.016, 0], [-3, 0.016, 0], [0, 0.016, 3], [0, 0.016, -4],
        [5, 0.016, 0], [-1, 0.016, -2],
      ].map((p, i) => (
        <group key={`mh-${i}`}>
          <mesh position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 12]} />
            <meshStandardMaterial color="#2d3748" roughness={0.9} metalness={0.3} />
          </mesh>
          {/* Manhole cross pattern */}
          <mesh position={[p[0], p[1] + 0.001, p[2]] as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 12]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Drain grates */}
      {[
        [1, 0.016, 0.35], [-2, 0.016, -0.35], [4, 0.016, 0.35], [-5, 0.016, -0.35],
      ].map((p, i) => (
        <group key={`drain-${i}`} position={p as [number, number, number]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 0.1]} />
            <meshStandardMaterial color="#1f2937" roughness={0.9} />
          </mesh>
          {/* Grate lines */}
          {Array.from({ length: 4 }).map((_, j) => (
            <mesh key={`gl-${j}`} position={[-0.06 + j * 0.04, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.008, 0.08]} />
              <meshStandardMaterial color="#374151" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* =============================================
   Parking lot
   ============================================= */
function ParkingLot() {
  return (
    <group position={[8, 0, -2]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((z, i) => (
        <mesh key={i} position={[0, 0.015, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 0.03]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/* =============================================
   Main Ground Component
   ============================================= */
export function Ground() {
  const { environmentObjects } = useGameStore()
  
  return (
    <group>
      {/* Main ground — grass */}
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.95} />
      </mesh>

      {/* Campus lawn (lighter green center) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3a7a34" roughness={0.95} />
      </mesh>

      {/* Asphalt paths with crosswalks */}
      <Paths />

      {/* Ground details — manhole covers, drains */}
      <GroundDetails />

      {/* Parking lot */}
      <ParkingLot />

      {/* Pond with fountain */}
      <Pond />

      {/* Environment objects */}
      {environmentObjects.map(obj => (
        <EnvironmentItem key={obj.id} obj={obj} />
      ))}

      {/* Modern perimeter fence */}
      {Array.from({ length: 15 }).map((_, i) => (
        <group key={`fence-n-${i}`} position={[-7 + i, 0, -10]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.5, -10]}>
        <boxGeometry args={[14, 0.02, 0.02]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, -10]}>
        <boxGeometry args={[14, 0.02, 0.02]} />
        <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}
