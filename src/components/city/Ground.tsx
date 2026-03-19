'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Pine Tree (pointed, layered cones)
// ============================================================================
function PineTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.05, 0.09, 0.8, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      {/* Roots visible */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <mesh key={`root-${i}`} position={[Math.cos(angle) * 0.1, 0.05, Math.sin(angle) * 0.1]}
              rotation={[Math.sin(angle) * 0.5, 0, Math.cos(angle) * 0.5]}>
          <cylinderGeometry args={[0.015, 0.03, 0.15, 3]} />
          <meshStandardMaterial color="#4a3018" roughness={0.95} />
        </mesh>
      ))}
      {/* Canopy layers (4 tiers) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <coneGeometry args={[0.5, 0.6, 6]} />
        <meshStandardMaterial color="#1e4a1e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.42, 0.55, 6]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.32, 0.5, 6]} />
        <meshStandardMaterial color="#3d7326" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.2, 0.4, 6]} />
        <meshStandardMaterial color="#4a8a2e" roughness={0.85} />
      </mesh>
      {/* Snow cap on tip */}
      <mesh position={[0, 1.78, 0]}>
        <coneGeometry args={[0.06, 0.08, 5]} />
        <meshStandardMaterial color="#e8e8e0" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ============================================================================
// Birch Tree (white trunk, rounder canopy)
// ============================================================================
function BirchTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* White trunk with dark spots */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.06, 1.2, 6]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.7} />
      </mesh>
      {/* Dark rings on trunk */}
      {[0.3, 0.5, 0.7, 0.9].map((y, i) => (
        <mesh key={`ring-${i}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 6]} />
          <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
        </mesh>
      ))}
      {/* Branch */}
      <mesh position={[0.08, 0.8, 0]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.012, 0.018, 0.3, 4]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.7} />
      </mesh>
      {/* Round canopy layers */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshStandardMaterial color="#5a9a2e" roughness={0.85} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.15, 1.15, 0.1]} castShadow>
        <sphereGeometry args={[0.3, 7, 5]} />
        <meshStandardMaterial color="#4a8a24" roughness={0.85} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.1, 1.4, -0.08]} castShadow>
        <sphereGeometry args={[0.25, 7, 5]} />
        <meshStandardMaterial color="#6aaa38" roughness={0.85} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

// ============================================================================
// Oak Tree (wider, fuller canopy)
// ============================================================================
function OakTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Thick trunk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      {/* Main branches */}
      <mesh position={[0.15, 0.7, 0]} rotation={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.03, 0.05, 0.4, 4]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.75, 0.05]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.025, 0.04, 0.35, 4]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      {/* Wide canopy */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshStandardMaterial color="#3a6a1e" roughness={0.85} />
      </mesh>
      <mesh position={[0.3, 1.0, 0.2]} castShadow>
        <sphereGeometry args={[0.35, 7, 5]} />
        <meshStandardMaterial color="#4a7a28" roughness={0.85} />
      </mesh>
      <mesh position={[-0.25, 1.15, -0.15]} castShadow>
        <sphereGeometry args={[0.32, 7, 5]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 1.3, -0.1]} castShadow>
        <sphereGeometry args={[0.28, 7, 5]} />
        <meshStandardMaterial color="#5a8a30" roughness={0.85} />
      </mesh>
    </group>
  )
}

// ============================================================================
// Decorative Rock
// ============================================================================
function DecoRock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow receiveShadow rotation={[0, 0, 0.15]} scale={[scale, scale * 0.6, scale]}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#7a7a72" roughness={0.95} metalness={0.0} />
      </mesh>
      {scale > 1.0 && (
        <mesh position={[0.2 * scale, 0.08, 0.1 * scale]} rotation={[0.2, 0.5, 0]}
              scale={[scale * 0.4, scale * 0.3, scale * 0.35]}>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#8a8a82" roughness={0.95} />
        </mesh>
      )}
    </group>
  )
}

// ============================================================================
// Fallen log / Stump
// ============================================================================
function FallenLog({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, rotation, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.8, 6]} />
      <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
    </mesh>
  )
}

function Stump({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.15, 8]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
      </mesh>
      {/* Ring detail on top */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.03, 0.08, 8]} />
        <meshStandardMaterial color="#7c5c35" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ============================================================================
// Flowers, Mushrooms, Berry Bushes
// ============================================================================
function FlowerCluster({ position, color = '#ff6688' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      {[[-0.03, 0, 0.02], [0.02, 0, -0.02], [0, 0, 0]].map((p, i) => (
        <group key={i} position={[p[0], 0, p[2]]}>
          {/* Stem */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.08, 3]} />
            <meshStandardMaterial color="#3a7a22" />
          </mesh>
          {/* Flower */}
          <mesh position={[0, 0.09, 0]}>
            <sphereGeometry args={[0.018, 5, 5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Mushroom({ position, color = '#cc4444' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.008, 0.01, 0.05, 4]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <sphereGeometry args={[0.022, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* White spots */}
      <mesh position={[0.01, 0.06, 0.01]}>
        <sphereGeometry args={[0.005, 4, 4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function BerryBush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Bush body */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.9} />
      </mesh>
      {/* Berries */}
      {[
        [0.08, 0.14, 0.05], [-0.06, 0.12, 0.08], [0.03, 0.16, -0.06],
        [-0.04, 0.08, -0.09], [0.09, 0.1, -0.04]
      ].map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]}>
          <sphereGeometry args={[0.015, 5, 5]} />
          <meshStandardMaterial color="#6622aa" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Upgraded Pond
// ============================================================================
function Pond() {
  const fishRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (fishRef.current) {
      const t = state.clock.elapsedTime
      fishRef.current.position.x = Math.sin(t * 0.5) * 1.0
      fishRef.current.position.z = Math.cos(t * 0.5) * 0.8
    }
  })

  return (
    <group position={[10, 0.01, -8]}>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.5, 24]} />
        <meshStandardMaterial
          color="#3a8abf"
          emissive="#1a5a8f"
          emissiveIntensity={0.15}
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.3}
        />
      </mesh>
      {/* Pond edge ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <ringGeometry args={[2.3, 2.8, 24]} />
        <meshStandardMaterial color="#5a7a55" roughness={0.9} />
      </mesh>
      {/* Sandy edge detail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[2.5, 2.7, 24]} />
        <meshStandardMaterial color="#a08860" roughness={0.95} />
      </mesh>

      {/* Lily pads */}
      {[
        [0.8, 0.6], [-0.5, 0.9], [1.2, -0.4], [-1.0, -0.7], [0.2, -1.1]
      ].map((p, i) => (
        <mesh key={`lily-${i}`} position={[p[0], 0.02, p[1]]} rotation={[-Math.PI / 2, 0, i * 1.3]}>
          <circleGeometry args={[0.12 + i * 0.02, 8]} />
          <meshStandardMaterial color="#3a7a2e" roughness={0.7} />
        </mesh>
      ))}
      {/* Lily flowers */}
      <mesh position={[0.8, 0.04, 0.6]}>
        <sphereGeometry args={[0.04, 5, 5]} />
        <meshStandardMaterial color="#ff88aa" emissive="#ff6688" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-1.0, 0.04, -0.7]}>
        <sphereGeometry args={[0.035, 5, 5]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffeecc" emissiveIntensity={0.2} />
      </mesh>

      {/* Cattails */}
      {[
        [1.8, 0, 1.0], [2.0, 0, 0.7], [1.9, 0, 1.3], [-1.5, 0, -1.5], [-1.7, 0, -1.3]
      ].map((c, i) => (
        <group key={`cattail-${i}`} position={[c[0], 0, c[2]]}>
          {/* Stem */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.008, 0.01, 0.5, 3]} />
            <meshStandardMaterial color="#4a7a30" />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 4]} />
            <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
          </mesh>
          {/* Leaves */}
          <mesh position={[0.04, 0.15, 0]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.12, 0.008, 0.02]} />
            <meshStandardMaterial color="#4a7a30" />
          </mesh>
        </group>
      ))}

      {/* Fish ripple */}
      <mesh ref={fishRef} position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.08, 8]} />
        <meshStandardMaterial color="#5aaadf" transparent opacity={0.4} />
      </mesh>

      {/* Stones at pond edge */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const r = 2.4 + Math.sin(i * 3.7) * 0.2
        return (
          <mesh key={`pstone-${i}`} position={[Math.cos(angle) * r, 0.06, Math.sin(angle) * r]}
                rotation={[Math.sin(i) * 0.3, i * 0.8, 0]}
                scale={[0.15 + Math.sin(i * 2.3) * 0.05, 0.08, 0.12]}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#6a6a62" roughness={0.95} />
          </mesh>
        )
      })}
    </group>
  )
}

// ============================================================================
// Small Bridge
// ============================================================================
function Bridge({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Planks */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={`plank-${i}`} position={[-0.2 + i * 0.1, 0.05, 0]} castShadow>
          <boxGeometry args={[0.08, 0.025, 0.4]} />
          <meshStandardMaterial color="#7c5c35" roughness={0.9} />
        </mesh>
      ))}
      {/* Rails */}
      <mesh position={[0, 0.12, 0.18]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, -0.18]}>
        <boxGeometry args={[0.5, 0.03, 0.03]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      {/* Posts */}
      {[-0.2, 0.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.08, 0.18]}>
            <cylinderGeometry args={[0.012, 0.015, 0.12, 4]} />
            <meshStandardMaterial color="#5c3d1e" />
          </mesh>
          <mesh position={[x, 0.08, -0.18]}>
            <cylinderGeometry args={[0.012, 0.015, 0.12, 4]} />
            <meshStandardMaterial color="#5c3d1e" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ============================================================================
// Bird Nest
// ============================================================================
function BirdNest({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Nest bowl */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.02, 0.06, 6]} />
        <meshStandardMaterial color="#6a5a3a" roughness={0.95} />
      </mesh>
      {/* Twigs */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.04, 0.01, Math.sin(a) * 0.04]}
                rotation={[Math.sin(a) * 0.3, a, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.06, 3]} />
            <meshStandardMaterial color="#5c4a2a" />
          </mesh>
        )
      })}
      {/* Eggs */}
      <mesh position={[0.01, 0.015, 0]}>
        <sphereGeometry args={[0.012, 5, 5]} />
        <meshStandardMaterial color="#d8e8e0" />
      </mesh>
      <mesh position={[-0.01, 0.015, 0.01]}>
        <sphereGeometry args={[0.01, 5, 5]} />
        <meshStandardMaterial color="#d0e0d8" />
      </mesh>
    </group>
  )
}

// ============================================================================
// MAIN GROUND COMPONENT
// ============================================================================
export function Ground() {
  const rng = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453
    return x - Math.floor(x)
  }

  const treeData = useMemo(() => {
    const pines: { pos: [number, number, number]; scale: number; rotation: number }[] = []
    const birches: { pos: [number, number, number]; scale: number; rotation: number }[] = []
    const oaks: { pos: [number, number, number]; scale: number; rotation: number }[] = []

    for (let i = 0; i < 25; i++) {
      const angle = rng(i * 3) * Math.PI * 2
      const dist = 8 + rng(i * 7) * 18
      pines.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.7 + rng(i * 11) * 0.8,
        rotation: rng(i * 17) * Math.PI * 2,
      })
    }
    for (let i = 0; i < 12; i++) {
      const angle = rng(i * 5 + 50) * Math.PI * 2
      const dist = 10 + rng(i * 9 + 50) * 15
      birches.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.6 + rng(i * 13 + 50) * 0.6,
        rotation: rng(i * 19 + 50) * Math.PI * 2,
      })
    }
    for (let i = 0; i < 8; i++) {
      const angle = rng(i * 7 + 80) * Math.PI * 2
      const dist = 12 + rng(i * 11 + 80) * 14
      oaks.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.8 + rng(i * 13 + 80) * 0.7,
        rotation: rng(i * 17 + 80) * Math.PI * 2,
      })
    }
    return { pines, birches, oaks }
  }, [])

  const rockPositions = useMemo(() => {
    const positions: { pos: [number, number, number]; scale: number; rotation: number }[] = []
    for (let i = 0; i < 20; i++) {
      const angle = rng(i * 5 + 100) * Math.PI * 2
      const dist = 6 + rng(i * 11 + 100) * 20
      positions.push({
        pos: [Math.cos(angle) * dist, 0.15, Math.sin(angle) * dist],
        scale: 0.4 + rng(i * 13 + 100) * 1.8,
        rotation: rng(i * 19 + 100) * Math.PI * 2,
      })
    }
    return positions
  }, [])

  const decorPositions = useMemo(() => {
    const flowers: { pos: [number, number, number]; color: string }[] = []
    const mushrooms: { pos: [number, number, number]; color: string }[] = []
    const berries: [number, number, number][] = []
    const logs: { pos: [number, number, number]; rot: number }[] = []
    const stumps: [number, number, number][] = []

    for (let i = 0; i < 30; i++) {
      const angle = rng(i * 3 + 200) * Math.PI * 2
      const dist = 4 + rng(i * 7 + 200) * 22
      const colors = ['#ff6688', '#ffaa44', '#ff44aa', '#aabb44', '#44aaff', '#ffffff']
      flowers.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        color: colors[Math.floor(rng(i * 11 + 200) * colors.length)],
      })
    }
    for (let i = 0; i < 15; i++) {
      const angle = rng(i * 5 + 300) * Math.PI * 2
      const dist = 6 + rng(i * 9 + 300) * 18
      mushrooms.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        color: i % 3 === 0 ? '#cc4444' : i % 3 === 1 ? '#cc8844' : '#ddddaa',
      })
    }
    for (let i = 0; i < 8; i++) {
      const angle = rng(i * 7 + 400) * Math.PI * 2
      const dist = 8 + rng(i * 11 + 400) * 16
      berries.push([Math.cos(angle) * dist, 0, Math.sin(angle) * dist])
    }
    for (let i = 0; i < 6; i++) {
      const angle = rng(i * 3 + 500) * Math.PI * 2
      const dist = 10 + rng(i * 7 + 500) * 14
      logs.push({
        pos: [Math.cos(angle) * dist, 0.05, Math.sin(angle) * dist],
        rot: rng(i * 11 + 500) * Math.PI,
      })
    }
    for (let i = 0; i < 5; i++) {
      const angle = rng(i * 5 + 600) * Math.PI * 2
      const dist = 9 + rng(i * 9 + 600) * 15
      stumps.push([Math.cos(angle) * dist, 0.07, Math.sin(angle) * dist])
    }

    return { flowers, mushrooms, berries, logs, stumps }
  }, [])

  return (
    <>
      {/* Main ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#5a8a3c" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Inner terrain */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#6aaa40" roughness={0.9} />
      </mesh>

      {/* Dirt paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.0, 28]} />
        <meshStandardMaterial color="#a08860" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.0, 28]} />
        <meshStandardMaterial color="#a08860" roughness={1} />
      </mesh>
      {/* Path edge detail */}
      {[-0.55, 0.55].map((offset, i) => (
        <group key={`pedge-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offset, 0.004, 0]}>
            <planeGeometry args={[0.15, 28]} />
            <meshStandardMaterial color="#8a7650" roughness={1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.004, offset]}>
            <planeGeometry args={[0.15, 28]} />
            <meshStandardMaterial color="#8a7650" roughness={1} />
          </mesh>
        </group>
      ))}

      {/* Central stone square */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[2.2, 8]} />
        <meshStandardMaterial color="#8a8070" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.7, 8]} />
        <meshStandardMaterial color="#9a9080" roughness={0.85} />
      </mesh>
      {/* Central well/post */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.3, 8]} />
        <meshStandardMaterial color="#7a7a72" roughness={0.9} />
      </mesh>

      {/* Surrounding terrain hills */}
      {[
        [0, 0.3, -28] as [number, number, number],
        [0, 0.3, 28] as [number, number, number],
        [-28, 0.3, 0] as [number, number, number],
        [28, 0.3, 0] as [number, number, number],
      ].map((pos, i) => (
        <mesh key={`hill-${i}`} position={pos} receiveShadow>
          <boxGeometry args={[i < 2 ? 60 : 6, 0.8, i < 2 ? 6 : 60]} />
          <meshStandardMaterial color="#4a7a30" roughness={0.95} />
        </mesh>
      ))}

      {/* Fog at ground edges */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const r = 26
        return (
          <mesh key={`fog-${i}`} position={[Math.cos(angle) * r, 0.5, Math.sin(angle) * r]}
                rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[4, 8]} />
            <meshStandardMaterial color="#c8d8c0" transparent opacity={0.15} />
          </mesh>
        )
      })}

      {/* Pond */}
      <Pond />

      {/* Trees - variety */}
      {treeData.pines.map((t, i) => (
        <PineTree key={`pine-${i}`} position={t.pos} scale={t.scale} rotation={t.rotation} />
      ))}
      {treeData.birches.map((t, i) => (
        <BirchTree key={`birch-${i}`} position={t.pos} scale={t.scale} rotation={t.rotation} />
      ))}
      {treeData.oaks.map((t, i) => (
        <OakTree key={`oak-${i}`} position={t.pos} scale={t.scale} rotation={t.rotation} />
      ))}

      {/* Rocks */}
      {rockPositions.map((r, i) => (
        <DecoRock key={`rock-${i}`} position={r.pos} scale={r.scale} rotation={r.rotation} />
      ))}

      {/* Flowers */}
      {decorPositions.flowers.map((f, i) => (
        <FlowerCluster key={`flower-${i}`} position={f.pos} color={f.color} />
      ))}

      {/* Mushrooms */}
      {decorPositions.mushrooms.map((m, i) => (
        <Mushroom key={`mush-${i}`} position={m.pos} color={m.color} />
      ))}

      {/* Berry bushes */}
      {decorPositions.berries.map((b, i) => (
        <BerryBush key={`berry-${i}`} position={b} />
      ))}

      {/* Fallen logs */}
      {decorPositions.logs.map((l, i) => (
        <FallenLog key={`log-${i}`} position={l.pos} rotation={l.rot} />
      ))}

      {/* Stumps */}
      {decorPositions.stumps.map((s, i) => (
        <Stump key={`stump-${i}`} position={s} />
      ))}

      {/* Small bridges at path crossings */}
      <Bridge position={[3, 0.02, 0]} rotation={0} />
      <Bridge position={[-3, 0.02, 0]} rotation={0} />
      <Bridge position={[0, 0.02, 3]} rotation={Math.PI / 2} />
      <Bridge position={[0, 0.02, -3]} rotation={Math.PI / 2} />

      {/* Bird nests in some trees */}
      {treeData.pines.slice(0, 3).map((t, i) => (
        <BirdNest key={`nest-${i}`} position={[t.pos[0], 1.0 * t.scale, t.pos[2]]} />
      ))}
    </>
  )
}
