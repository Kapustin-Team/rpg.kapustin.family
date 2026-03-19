'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore, type EnvironmentObject } from '@/store/gameStore'

/* =============================================
   Environment object models
   ============================================= */
function ModernTree({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Modern planter base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.3, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
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
    </group>
  )
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.2]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.4, -0.09]}>
        <boxGeometry args={[0.6, 0.2, 0.03]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Legs */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]}>
          <boxGeometry args={[0.03, 0.25, 0.18]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </mesh>
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
      {/* Pole */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.025, 0.04, 2.4, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.15, 2.3, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.015, 0.02, 0.35, 4]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Light globe */}
      <mesh ref={lightRef} position={[0.25, 2.35, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
      </mesh>
      {/* Light cone (subtle glow) */}
      <mesh position={[0.25, 1.5, 0]}>
        <coneGeometry args={[0.6, 1.7, 8, 1, true]} />
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
      {/* Base */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.9, 0.15]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.6, 0.08]}>
        <boxGeometry args={[0.12, 0.15, 0.01]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
      {/* Cable */}
      <mesh position={[0, 0.25, 0.1]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 4]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      {/* Status light */}
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
      {/* Concrete planter */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} metalness={0} />
      </mesh>
      {/* Plants */}
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
      {/* Body */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.5, 0.15, 0.25]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.02, 0.24, 0]}>
        <boxGeometry args={[0.25, 0.12, 0.22]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Wheels */}
      {[[-0.15, 0.04, 0.13], [-0.15, 0.04, -0.13], [0.15, 0.04, 0.13], [0.15, 0.04, -0.13]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
          <meshStandardMaterial color="#1f2937" roughness={0.7} />
        </mesh>
      ))}
      {/* Headlights */}
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
  const { editMode, updateEnvironmentPosition, deleteEnvironment, updateEnvironmentRotation } = useGameStore()

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
      {/* Water surface */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 24]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.6} roughness={0.2} transparent opacity={0.7} />
      </mesh>
      {/* Edge */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.3, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      {/* Fountain jets */}
      <group ref={jetRef}>
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[Math.sin(i * 2.1) * 0.2, 0.3, Math.cos(i * 2.1) * 0.2]}>
            <cylinderGeometry args={[0.015, 0.005, 0.4, 4]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
      {/* Center fountain base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.12, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/* =============================================
   Asphalt paths
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
      {/* Path markings (subtle white dashes) */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[-9.5 + i, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 0.03]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.8} />
        </mesh>
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
      {/* Asphalt surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial color="#1f2937" roughness={0.95} />
      </mesh>
      {/* Parking lines */}
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

      {/* Asphalt paths */}
      <Paths />

      {/* Parking lot */}
      <ParkingLot />

      {/* Pond with fountain */}
      <Pond />

      {/* Environment objects */}
      {environmentObjects.map(obj => (
        <EnvironmentItem key={obj.id} obj={obj} />
      ))}

      {/* Modern perimeter fence */}
      {/* North side */}
      {Array.from({ length: 15 }).map((_, i) => (
        <group key={`fence-n-${i}`} position={[-7 + i, 0, -10]}>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
            <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Fence rails north */}
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
