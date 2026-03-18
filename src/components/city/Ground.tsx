'use client'

import { useMemo } from 'react'

function DecoTree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 6]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.9} />
      </mesh>
      {/* Bottom canopy - largest */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <coneGeometry args={[0.45, 0.7, 6]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.85} />
      </mesh>
      {/* Middle canopy */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.35, 0.6, 6]} />
        <meshStandardMaterial color="#3d7326" roughness={0.85} />
      </mesh>
      {/* Top canopy - smallest */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.22, 0.5, 6]} />
        <meshStandardMaterial color="#4a8a2e" roughness={0.85} />
      </mesh>
    </group>
  )
}

function DecoRock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <mesh position={position} castShadow receiveShadow rotation={[0, rotation, 0.15]} scale={[scale, scale * 0.6, scale]}>
      <icosahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#7a7a72" roughness={0.95} metalness={0.0} />
    </mesh>
  )
}

function Pond() {
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
    </group>
  )
}

export function Ground() {
  const rng = (seed: number) => {
    const x = Math.sin(seed * 127.1) * 43758.5453
    return x - Math.floor(x)
  }

  const treePositions = useMemo(() => {
    const positions: { pos: [number, number, number]; scale: number; rotation: number }[] = []
    for (let i = 0; i < 40; i++) {
      const angle = rng(i * 3) * Math.PI * 2
      const dist = 8 + rng(i * 7) * 18
      positions.push({
        pos: [Math.cos(angle) * dist, 0, Math.sin(angle) * dist],
        scale: 0.7 + rng(i * 11) * 0.8,
        rotation: rng(i * 17) * Math.PI * 2,
      })
    }
    return positions
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

  return (
    <>
      {/* Main ground — bright grass green */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#5a8a3c" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* Inner terrain — slightly brighter */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#6aaa40" roughness={0.9} />
      </mesh>

      {/* Dirt path - from HQ toward edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.0, 28]} />
        <meshStandardMaterial color="#a08860" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1.0, 28]} />
        <meshStandardMaterial color="#a08860" roughness={1} />
      </mesh>

      {/* Central square — stone circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[2.2, 8]} />
        <meshStandardMaterial color="#8a8070" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[1.7, 8]} />
        <meshStandardMaterial color="#9a9080" roughness={0.85} />
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

      {/* Pond */}
      <Pond />

      {/* Decorative trees */}
      {treePositions.map((t, i) => (
        <DecoTree key={`tree-${i}`} position={t.pos} scale={t.scale} rotation={t.rotation} />
      ))}

      {/* Decorative rocks */}
      {rockPositions.map((r, i) => (
        <DecoRock key={`rock-${i}`} position={r.pos} scale={r.scale} rotation={r.rotation} />
      ))}
    </>
  )
}
