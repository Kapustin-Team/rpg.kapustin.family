'use client'

import { useMemo } from 'react'

function DecoTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.15, 0.6, 0.15]} />
        <meshStandardMaterial color="#5c3a1a" roughness={0.9} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <coneGeometry args={[0.35, 0.8, 6]} />
        <meshStandardMaterial color="#1a4a1a" emissive="#0a2a0a" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <coneGeometry args={[0.25, 0.6, 6]} />
        <meshStandardMaterial color="#2d5a27" emissive="#1a3a15" emissiveIntensity={0.1} roughness={0.9} />
      </mesh>
    </group>
  )
}

function DecoRock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.4 * scale, 0.25 * scale, 0.35 * scale]} />
      <meshStandardMaterial color="#4a4a4a" roughness={1} metalness={0} />
    </mesh>
  )
}

export function Ground() {
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = []
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1) * 43758.5453
      return x - Math.floor(x)
    }
    for (let i = 0; i < 30; i++) {
      const angle = rng(i * 3) * Math.PI * 2
      const dist = 10 + rng(i * 7) * 15
      positions.push([
        Math.cos(angle) * dist,
        0,
        Math.sin(angle) * dist,
      ])
    }
    return positions
  }, [])

  const rockPositions = useMemo(() => {
    const positions: { pos: [number, number, number]; scale: number }[] = []
    const rng = (seed: number) => {
      const x = Math.sin(seed * 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    for (let i = 0; i < 15; i++) {
      const angle = rng(i * 5) * Math.PI * 2
      const dist = 8 + rng(i * 11) * 18
      positions.push({
        pos: [Math.cos(angle) * dist, 0.1, Math.sin(angle) * dist],
        scale: 0.5 + rng(i * 13) * 1.5,
      })
    }
    return positions
  }, [])

  return (
    <>
      {/* Main ground — dark forest green */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#1a2e1a"
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Inner terrain — slightly lighter */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1e331e" roughness={0.9} />
      </mesh>

      {/* Roads — stone paths */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[0.8, 24]} />
        <meshStandardMaterial color="#3a3a3a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.002, 0]}>
        <planeGeometry args={[0.8, 24]} />
        <meshStandardMaterial color="#3a3a3a" roughness={1} />
      </mesh>

      {/* Central square — stone circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[2.0, 6]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <circleGeometry args={[1.6, 6]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>

      {/* Decorative trees */}
      {treePositions.map((pos, i) => (
        <DecoTree key={`tree-${i}`} position={pos} />
      ))}

      {/* Decorative rocks */}
      {rockPositions.map((r, i) => (
        <DecoRock key={`rock-${i}`} position={r.pos} scale={r.scale} />
      ))}
    </>
  )
}
