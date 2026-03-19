'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Building as BuildingType } from '@/store/gameStore'
import { useGameStore } from '@/store/gameStore'

interface BuildingProps {
  building: BuildingType
}

export function Building({ building }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedBuilding, setIsPanelOpen } = useGameStore()

  const isConstructing = building.status === 'under_construction'
  const isPlanned = building.status === 'planned'
  const isActive = building.status === 'active'
  const opacity = isPlanned ? 0.3 : isConstructing ? 0.6 : 1.0

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(t * 0.8 + building.position[0]) * 0.005
  })

  const handleClick = () => {
    setSelectedBuilding(building.id)
    setIsPanelOpen(true)
  }

  const matProps = (color: string, emissive?: string, emissiveIntensity?: number) => ({
    color: hovered ? '#e8c97e' : color,
    emissive: hovered ? '#c9a84c' : (emissive || '#000000'),
    emissiveIntensity: hovered ? 0.5 : (emissiveIntensity || 0.1),
    transparent: true as const,
    opacity,
    roughness: 0.85,
    metalness: 0.05,
  })

  const renderModel = () => {
    switch (building.type) {
      case 'hq':
      case 'tower':
        return <HQModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      case 'farm':
        return <FarmModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      case 'library':
        return <LibraryModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      case 'lab':
        return <LabModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      case 'server':
        return <ServerModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      case 'barracks':
        return <BarracksModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
      default:
        return <DefaultModel hovered={hovered} opacity={opacity} isActive={isActive} matProps={matProps} />
    }
  }

  return (
    <group position={building.position} ref={groupRef}>
      <group
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {renderModel()}
      </group>

      {/* Scaffolding for under_construction */}
      {isConstructing && (
        <group>
          {[
            [1.2, 1.0, 1.2],
            [-1.2, 1.0, 1.2],
            [1.2, 1.0, -1.2],
            [-1.2, 1.0, -1.2],
          ].map((p, i) => (
            <mesh key={`scaffold-${i}`} position={[p[0], p[1], p[2]]} rotation={[0.1 * (i % 2 === 0 ? 1 : -1), 0, 0.15 * (i < 2 ? 1 : -1)]}>
              <cylinderGeometry args={[0.03, 0.03, 2.2, 4]} />
              <meshStandardMaterial color="#8b7355" roughness={0.9} transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* Status light */}
      <mesh position={[0.5, 0.3, 0.5]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={isActive ? '#00ff66' : isConstructing ? '#ff8800' : '#666666'}
          emissive={isActive ? '#00ff66' : isConstructing ? '#ff8800' : '#666666'}
          emissiveIntensity={isActive ? 2.0 : isConstructing ? 1.5 : 0.3}
        />
      </mesh>

      {/* Level badge */}
      <mesh position={[0, 2.8, 0.3]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.4} />
      </mesh>

      {/* Construction progress */}
      {isConstructing && (
        <Html position={[0, 3, 0]} center distanceFactor={8}>
          <div style={{
            background: 'rgba(13, 17, 23, 0.92)',
            border: '1px solid #c9a84c',
            borderRadius: 2,
            padding: '2px 8px',
            color: '#c9a84c',
            fontSize: 11,
            whiteSpace: 'nowrap',
            fontFamily: "'Courier New', monospace",
            boxShadow: '0 0 10px rgba(201, 168, 76, 0.2)',
          }}>
            ⚒️ {building.constructionProgress}%
          </div>
        </Html>
      )}

      {/* Name on hover */}
      {hovered && (
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.22}
          color="#c9a84c"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#0d1117"
          font={undefined}
        >
          {building.name}
        </Text>
      )}

      {/* Ground shadow */}
      <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

type ModelProps = {
  hovered: boolean
  opacity: number
  isActive: boolean
  matProps: (color: string, emissive?: string, emissiveIntensity?: number) => object
}

// ============================================================================
// HELPER: Animated fire/smoke particles
// ============================================================================
function AnimatedFire({ position, scale = 1, color = '#ff6600' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const ref1 = useRef<THREE.Mesh>(null)
  const ref2 = useRef<THREE.Mesh>(null)
  const ref3 = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref1.current) {
      ref1.current.scale.set(0.8 + Math.sin(t * 8) * 0.3, 1 + Math.sin(t * 6) * 0.4, 0.8 + Math.cos(t * 7) * 0.3)
      ref1.current.position.y = 0.15 * scale + Math.sin(t * 5) * 0.03 * scale
    }
    if (ref2.current) {
      ref2.current.scale.set(0.6 + Math.sin(t * 9 + 1) * 0.2, 0.8 + Math.sin(t * 7 + 2) * 0.3, 0.6 + Math.cos(t * 8 + 1) * 0.2)
      ref2.current.position.y = 0.25 * scale + Math.sin(t * 6 + 1) * 0.04 * scale
    }
    if (ref3.current) {
      ref3.current.scale.set(0.4 + Math.sin(t * 10 + 2) * 0.15, 0.6 + Math.sin(t * 8 + 3) * 0.2, 0.4 + Math.cos(t * 9 + 2) * 0.15)
      ref3.current.position.y = 0.35 * scale + Math.sin(t * 7 + 2) * 0.03 * scale
    }
  })

  return (
    <group position={position}>
      <mesh ref={ref1}>
        <coneGeometry args={[0.08 * scale, 0.25 * scale, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.85} />
      </mesh>
      <mesh ref={ref2}>
        <coneGeometry args={[0.06 * scale, 0.2 * scale, 6]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2.5} transparent opacity={0.7} />
      </mesh>
      <mesh ref={ref3}>
        <coneGeometry args={[0.04 * scale, 0.15 * scale, 5]} />
        <meshStandardMaterial color="#ffdd44" emissive="#ffdd44" emissiveIntensity={3} transparent opacity={0.6} />
      </mesh>
      {/* Point light for glow */}
      <pointLight color={color} intensity={0.5 * scale} distance={3 * scale} />
    </group>
  )
}

function AnimatedSmoke({ position, color = '#aaaaaa', scale = 1 }: { position: [number, number, number]; color?: string; scale?: number }) {
  const refs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.forEach((ref, i) => {
      if (ref.current) {
        const offset = i * 0.8
        ref.current.position.y = (0.1 + ((t * 0.3 + offset) % 1.5)) * scale
        ref.current.scale.setScalar((0.3 + ((t * 0.3 + offset) % 1.5) * 0.5) * scale)
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.opacity = Math.max(0, 0.4 - ((t * 0.3 + offset) % 1.5) * 0.25)
      }
    })
  })

  return (
    <group position={position}>
      {refs.map((ref, i) => (
        <mesh key={i} ref={ref}>
          <sphereGeometry args={[0.12, 6, 6]} />
          <meshStandardMaterial color={color} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// HQ — Viking Great Hall / Longhouse
// ============================================================================
function HQModel({ matProps, isActive }: ModelProps) {
  const flagRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  // Generate stone foundation positions
  const stones = useMemo(() => {
    const s: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number, number] }[] = []
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2
      const r = 1.5 + Math.sin(i * 7.3) * 0.15
      s.push({
        pos: [Math.cos(angle) * r, 0.08 + Math.sin(i * 3.7) * 0.04, Math.sin(angle) * r],
        rot: [Math.sin(i * 2.1) * 0.2, Math.sin(i * 5.3) * 0.3, Math.sin(i * 4.1) * 0.15],
        size: [0.18 + Math.sin(i * 8.3) * 0.06, 0.12 + Math.sin(i * 6.1) * 0.04, 0.16 + Math.sin(i * 9.7) * 0.05],
      })
    }
    return s
  }, [])

  return (
    <group>
      {/* ===== Stone Foundation — individual stones ===== */}
      {stones.map((s, i) => (
        <mesh key={`stone-${i}`} position={s.pos} rotation={s.rot} castShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial {...matProps('#7a7a72', '#5a5a52', 0.02)} roughness={0.95} />
        </mesh>
      ))}

      {/* Foundation platform */}
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[3.2, 0.15, 2.2]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.03)} roughness={0.95} />
      </mesh>

      {/* ===== Log Walls — individual horizontal logs ===== */}
      {/* Front wall logs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`flog-${i}`} castShadow position={[0, 0.25 + i * 0.18, 0.85]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.8, 6]} />
          <meshStandardMaterial {...matProps(i % 2 === 0 ? '#6b4a2a' : '#7c5c35', '#4a3018', 0.05)} roughness={0.9} />
        </mesh>
      ))}
      {/* Back wall logs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`blog-${i}`} castShadow position={[0, 0.25 + i * 0.18, -0.85]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.8, 6]} />
          <meshStandardMaterial {...matProps(i % 2 === 0 ? '#6b4a2a' : '#7c5c35', '#4a3018', 0.05)} roughness={0.9} />
        </mesh>
      ))}
      {/* Left wall logs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`llog-${i}`} castShadow position={[-1.4, 0.25 + i * 0.18, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 1.7, 6]} />
          <meshStandardMaterial {...matProps(i % 2 === 0 ? '#7c5c35' : '#6b4a2a', '#4a3018', 0.05)} roughness={0.9} />
        </mesh>
      ))}
      {/* Right wall logs */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`rlog-${i}`} castShadow position={[1.4, 0.25 + i * 0.18, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 1.7, 6]} />
          <meshStandardMaterial {...matProps(i % 2 === 0 ? '#7c5c35' : '#6b4a2a', '#4a3018', 0.05)} roughness={0.9} />
        </mesh>
      ))}

      {/* ===== Corner vertical posts ===== */}
      {[
        [1.4, 0, 0.85], [-1.4, 0, 0.85], [1.4, 0, -0.85], [-1.4, 0, -0.85]
      ].map((p, i) => (
        <mesh key={`post-${i}`} castShadow position={[p[0], 0.95, p[2]]}>
          <boxGeometry args={[0.14, 1.7, 0.14]} />
          <meshStandardMaterial {...matProps('#5c3d1e', '#3a2510', 0.05)} roughness={0.9} />
        </mesh>
      ))}

      {/* ===== Multi-layered thatched roof ===== */}
      {/* Roof layer 1 - base */}
      <mesh castShadow position={[-0.45, 2.05, 0]} rotation={[0, 0, Math.PI / 4.5]}>
        <boxGeometry args={[1.5, 0.1, 2.0]} />
        <meshStandardMaterial {...matProps('#a08040', '#806020', 0.05)} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.45, 2.05, 0]} rotation={[0, 0, -Math.PI / 4.5]}>
        <boxGeometry args={[1.5, 0.1, 2.0]} />
        <meshStandardMaterial {...matProps('#a08040', '#806020', 0.05)} roughness={0.95} />
      </mesh>
      {/* Roof layer 2 - thatch overlay */}
      <mesh castShadow position={[-0.4, 2.12, 0]} rotation={[0, 0, Math.PI / 4.5]}>
        <boxGeometry args={[1.4, 0.06, 1.9]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.05)} roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0.4, 2.12, 0]} rotation={[0, 0, -Math.PI / 4.5]}>
        <boxGeometry args={[1.4, 0.06, 1.9]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.05)} roughness={0.98} />
      </mesh>
      {/* Roof ridge beam */}
      <mesh castShadow position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 2.2, 6]} />
        <meshStandardMaterial {...matProps('#5c3d1e', '#3a2510', 0.05)} roughness={0.9} />
      </mesh>

      {/* ===== Visible rafters underneath ===== */}
      {Array.from({ length: 5 }).map((_, i) => {
        const z = -0.8 + i * 0.4
        return (
          <group key={`rafter-${i}`}>
            <mesh castShadow position={[-0.4, 1.9, z]} rotation={[0, 0, Math.PI / 4.5]}>
              <cylinderGeometry args={[0.025, 0.025, 1.3, 4]} />
              <meshStandardMaterial {...matProps('#5c3d1e')} />
            </mesh>
            <mesh castShadow position={[0.4, 1.9, z]} rotation={[0, 0, -Math.PI / 4.5]}>
              <cylinderGeometry args={[0.025, 0.025, 1.3, 4]} />
              <meshStandardMaterial {...matProps('#5c3d1e')} />
            </mesh>
          </group>
        )
      })}

      {/* ===== Dragon Head carvings on roof peaks ===== */}
      {[1, -1].map((side) => (
        <group key={`dragon-${side}`} position={[0, 2.5, side * 1.1]} rotation={[side * -0.3, 0, 0]}>
          {/* Neck */}
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.35, 6]} />
            <meshStandardMaterial {...matProps('#4a3018', '#2a1808', 0.05)} />
          </mesh>
          {/* Head */}
          <mesh castShadow position={[0, 0.2, side * 0.05]}>
            <boxGeometry args={[0.1, 0.08, 0.18]} />
            <meshStandardMaterial {...matProps('#4a3018', '#2a1808', 0.05)} />
          </mesh>
          {/* Snout */}
          <mesh castShadow position={[0, 0.22, side * 0.15]}>
            <boxGeometry args={[0.06, 0.05, 0.12]} />
            <meshStandardMaterial {...matProps('#3a2010', '#1a1008', 0.05)} />
          </mesh>
          {/* Horns */}
          <mesh castShadow position={[0.04, 0.26, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.02, 0.12, 4]} />
            <meshStandardMaterial {...matProps('#3a2010')} />
          </mesh>
          <mesh castShadow position={[-0.04, 0.26, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.02, 0.12, 4]} />
            <meshStandardMaterial {...matProps('#3a2010')} />
          </mesh>
        </group>
      ))}

      {/* ===== Tall wooden doors with iron hinges ===== */}
      {/* Door frame */}
      <mesh castShadow position={[0.22, 0.65, 0.88]}>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      <mesh castShadow position={[-0.22, 0.65, 0.88]}>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      <mesh castShadow position={[0, 1.22, 0.88]}>
        <boxGeometry args={[0.52, 0.08, 0.08]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      {/* Door panels */}
      <mesh position={[0.1, 0.6, 0.9]}>
        <boxGeometry args={[0.18, 0.9, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>
      <mesh position={[-0.1, 0.6, 0.9]}>
        <boxGeometry args={[0.18, 0.9, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>
      {/* Iron hinges */}
      {[0.4, 0.7, 1.0].map((y, i) => (
        <mesh key={`hinge-${i}`} position={[0.19, y, 0.925]}>
          <boxGeometry args={[0.12, 0.025, 0.015]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      {[0.4, 0.7, 1.0].map((y, i) => (
        <mesh key={`hinge2-${i}`} position={[-0.19, y, 0.925]}>
          <boxGeometry args={[0.12, 0.025, 0.015]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* ===== Wooden stairs leading to entrance ===== */}
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`stair-${i}`} castShadow position={[0, 0.08 + i * 0.06, 1.0 + i * 0.12]}>
          <boxGeometry args={[0.6, 0.06, 0.12]} />
          <meshStandardMaterial {...matProps('#7c5c35')} />
        </mesh>
      ))}

      {/* ===== Torch holders on walls ===== */}
      {[
        [1.45, 1.2, 0.4], [1.45, 1.2, -0.4], [-1.45, 1.2, 0.4], [-1.45, 1.2, -0.4]
      ].map((p, i) => (
        <group key={`torch-${i}`}>
          {/* Bracket */}
          <mesh castShadow position={[p[0], p[1], p[2]]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Torch */}
          <mesh castShadow position={[p[0] + (p[0] > 0 ? 0.06 : -0.06), p[1] + 0.05, p[2]]}>
            <cylinderGeometry args={[0.015, 0.025, 0.15, 4]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {isActive && (
            <AnimatedFire position={[p[0] + (p[0] > 0 ? 0.06 : -0.06), p[1] + 0.18, p[2]]} scale={0.4} />
          )}
        </group>
      ))}

      {/* ===== Banners hanging from walls ===== */}
      {[
        [0.7, 1.3, 0.88, '#8b2020'], [-0.7, 1.3, 0.88, '#c9a84c'],
        [0.7, 1.3, -0.88, '#1a4a8b'], [-0.7, 1.3, -0.88, '#8b2020']
      ].map((b, i) => (
        <group key={`banner-${i}`}>
          {/* Banner rod */}
          <mesh position={[b[0] as number, (b[1] as number) + 0.12, b[2] as number]}>
            <boxGeometry args={[0.25, 0.02, 0.02]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Banner cloth */}
          <mesh position={[b[0] as number, b[1] as number, b[2] as number]}>
            <boxGeometry args={[0.2, 0.3, 0.015]} />
            <meshStandardMaterial color={b[3] as string} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ===== Shield decorations on walls ===== */}
      {[
        [1.43, 0.8, 0, '#8b2020'], [1.43, 0.8, 0.5, '#1a4a8b'], [1.43, 0.8, -0.5, '#c9a84c'],
        [-1.43, 0.8, 0, '#4a7c4e'], [-1.43, 0.8, 0.5, '#8b2020'], [-1.43, 0.8, -0.5, '#c9a84c']
      ].map((s, i) => (
        <mesh key={`shield-${i}`} position={[s[0] as number, s[1] as number, s[2] as number]} rotation={[0, s[0] as number > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 8]} />
          <meshStandardMaterial color={s[3] as string} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ===== Windows with warm glow ===== */}
      {isActive && [
        [1.42, 1.0, 0.3], [1.42, 1.0, -0.3],
        [-1.42, 1.0, 0.3], [-1.42, 1.0, -0.3],
        [0.5, 1.0, 0.87], [-0.5, 1.0, 0.87],
      ].map((p, i) => (
        <mesh key={`win-${i}`} position={[p[0], p[1], p[2]]}>
          <boxGeometry args={[0.06, 0.15, 0.06]} />
          <meshStandardMaterial color="#e8c060" emissive="#e8a040" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* ===== Chimney with smoke ===== */}
      <mesh castShadow position={[0.6, 2.1, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial {...matProps('#6a6a62')} />
      </mesh>
      {isActive && <AnimatedSmoke position={[0.6, 2.45, 0]} scale={0.8} />}

      {/* ===== Flag pole + flag ===== */}
      <mesh castShadow position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
        <meshStandardMaterial {...matProps('#4a3a2a')} />
      </mesh>
      <mesh ref={flagRef} position={[0.18, 3.35, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.015]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.6} />
      </mesh>
      {/* Flag emblem */}
      <mesh position={[0.18, 3.35, 0.01]}>
        <boxGeometry args={[0.08, 0.08, 0.01]} />
        <meshStandardMaterial color="#8b2020" />
      </mesh>
    </group>
  )
}

// ============================================================================
// FARM — Norse Farmstead with Windmill
// ============================================================================
function FarmModel({ matProps, isActive }: ModelProps) {
  const windmillRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (windmillRef.current) {
      windmillRef.current.rotation.z = state.clock.elapsedTime * 0.8
    }
  })

  return (
    <group>
      {/* ===== Base/ground patch ===== */}
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[3.6, 0.1, 3.0]} />
        <meshStandardMaterial {...matProps('#5a8a3c', '#3a5a2a', 0.03)} roughness={0.95} />
      </mesh>

      {/* ===== Main Barn ===== */}
      {/* Barn body with timber frame */}
      <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.1, 1.3]} />
        <meshStandardMaterial {...matProps('#7c5c35', '#5c3d1e', 0.08)} roughness={0.9} />
      </mesh>
      {/* Timber frame beams (X pattern on front) */}
      <mesh castShadow position={[0, 0.7, 0.66]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.04, 1.2, 0.03]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      <mesh castShadow position={[0, 0.7, 0.66]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.04, 1.2, 0.03]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      {/* Horizontal beam */}
      <mesh castShadow position={[0, 0.7, 0.67]}>
        <boxGeometry args={[1.8, 0.06, 0.03]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      {/* Side timber X */}
      <mesh castShadow position={[0.91, 0.7, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.03, 0.04, 1.0]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      <mesh castShadow position={[0.91, 0.7, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.03, 0.04, 1.0]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>

      {/* ===== Thatched roof with grass tufts ===== */}
      <mesh castShadow position={[-0.3, 1.5, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[1.25, 0.08, 1.5]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.05)} roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0.3, 1.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.25, 0.08, 1.5]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.05)} roughness={0.98} />
      </mesh>
      {/* Green grass tufts on roof */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`tuft-${i}`} position={[
          -0.6 + Math.sin(i * 3.7) * 0.5,
          1.55 + Math.abs(Math.sin(i * 3.7) * 0.3) * 0.15,
          -0.5 + i * 0.15
        ]}>
          <coneGeometry args={[0.03, 0.08, 3]} />
          <meshStandardMaterial color="#4a8a2e" roughness={0.9} />
        </mesh>
      ))}

      {/* Barn door */}
      <mesh position={[0, 0.45, 0.67]}>
        <boxGeometry args={[0.4, 0.65, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>
      {/* Door hinges */}
      <mesh position={[0.18, 0.5, 0.695]}>
        <boxGeometry args={[0.1, 0.02, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.18, 0.7, 0.695]}>
        <boxGeometry args={[0.1, 0.02, 0.01]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* ===== Windmill ===== */}
      {/* Tower */}
      <mesh castShadow position={[1.4, 0.7, 0.7]}>
        <cylinderGeometry args={[0.18, 0.25, 1.2, 6]} />
        <meshStandardMaterial {...matProps('#8b7355', '#5c4a2a', 0.08)} roughness={0.9} />
      </mesh>
      {/* Windmill cap */}
      <mesh castShadow position={[1.4, 1.4, 0.7]}>
        <coneGeometry args={[0.22, 0.3, 6]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      {/* Blades hub */}
      <mesh castShadow position={[1.4, 1.25, 0.93]}>
        <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      {/* Windmill blades */}
      <group ref={windmillRef} position={[1.4, 1.25, 0.95]}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
          <group key={`blade-${i}`} rotation={[0, 0, rot]}>
            {/* Blade arm */}
            <mesh position={[0, 0.28, 0]}>
              <boxGeometry args={[0.03, 0.55, 0.015]} />
              <meshStandardMaterial {...matProps('#7c5c35')} />
            </mesh>
            {/* Blade sail */}
            <mesh position={[0.04, 0.3, 0]}>
              <boxGeometry args={[0.08, 0.4, 0.008]} />
              <meshStandardMaterial color="#d4c8a0" roughness={0.8} transparent opacity={0.85} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Gear mechanism visible */}
      <mesh position={[1.4, 1.25, 0.89]}>
        <cylinderGeometry args={[0.08, 0.08, 0.03, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* ===== Animal pen with fence ===== */}
      {/* Fence posts */}
      {[
        [-0.6, 0, -0.8], [-0.2, 0, -0.8], [0.2, 0, -0.8], [0.6, 0, -0.8],
        [-0.6, 0, -1.3], [0.6, 0, -1.3],
        [-0.6, 0, -1.05], [0.6, 0, -1.05],
      ].map((p, i) => (
        <mesh key={`fpost-${i}`} castShadow position={[p[0], 0.25, p[2]]}>
          <cylinderGeometry args={[0.02, 0.025, 0.4, 4]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
      ))}
      {/* Fence rails */}
      <mesh position={[0, 0.25, -0.8]}><boxGeometry args={[1.2, 0.03, 0.03]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[0, 0.35, -0.8]}><boxGeometry args={[1.2, 0.03, 0.03]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[0, 0.25, -1.3]}><boxGeometry args={[1.2, 0.03, 0.03]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[-0.6, 0.25, -1.05]}><boxGeometry args={[0.03, 0.03, 0.5]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[0.6, 0.25, -1.05]}><boxGeometry args={[0.03, 0.03, 0.5]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>

      {/* ===== Hay bales (stacked) ===== */}
      {[
        [-1.2, 0.15, -0.3, 0], [-1.2, 0.15, -0.05, 0.2],
        [-1.2, 0.15, 0.2, -0.1], [-1.2, 0.35, -0.15, 0.3],
      ].map((h, i) => (
        <mesh key={`hay-${i}`} castShadow position={[h[0], h[1], h[2]]} rotation={[Math.PI / 2, h[3], 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
          <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} roughness={0.95} />
        </mesh>
      ))}

      {/* ===== Water trough ===== */}
      <mesh castShadow position={[0.2, 0.15, -1.05]}>
        <boxGeometry args={[0.35, 0.12, 0.12]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh position={[0.2, 0.18, -1.05]}>
        <boxGeometry args={[0.28, 0.05, 0.08]} />
        <meshStandardMaterial color="#3a8abf" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>

      {/* ===== Garden plots with crops ===== */}
      {/* Plot 1 */}
      <mesh position={[-1.0, 0.06, 0.9]}><boxGeometry args={[0.6, 0.04, 0.4]} /><meshStandardMaterial color="#5a4a30" roughness={0.95} /></mesh>
      {/* Crop rows */}
      {Array.from({ length: 4 }).map((_, i) => (
        <group key={`crop1-${i}`}>
          {Array.from({ length: 3 }).map((_, j) => (
            <mesh key={`c-${j}`} position={[-1.2 + j * 0.2, 0.14, 0.78 + i * 0.08]}>
              <boxGeometry args={[0.03, 0.08, 0.03]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#4a8a2e' : '#3d7326'} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Plot 2 */}
      <mesh position={[-0.3, 0.06, 0.9]}><boxGeometry args={[0.5, 0.04, 0.4]} /><meshStandardMaterial color="#5a4a30" roughness={0.95} /></mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <group key={`crop2-${i}`}>
          {Array.from({ length: 3 }).map((_, j) => (
            <mesh key={`c2-${j}`} position={[-0.45 + j * 0.15, 0.14, 0.78 + i * 0.08]}>
              <boxGeometry args={[0.025, 0.06, 0.025]} />
              <meshStandardMaterial color={j % 2 === 0 ? '#c8a020' : '#4a8a2e'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ===== Cart with wheels ===== */}
      {/* Cart body */}
      <mesh castShadow position={[1.0, 0.22, -0.5]}>
        <boxGeometry args={[0.4, 0.15, 0.25]} />
        <meshStandardMaterial {...matProps('#7c5c35')} />
      </mesh>
      {/* Cart sides */}
      <mesh position={[1.0, 0.32, -0.37]}><boxGeometry args={[0.4, 0.1, 0.03]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[1.0, 0.32, -0.63]}><boxGeometry args={[0.4, 0.1, 0.03]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      {/* Wheels */}
      {[[-0.15, -0.37], [-0.15, -0.63], [0.15, -0.37], [0.15, -0.63]].map((w, i) => (
        <mesh key={`wheel-${i}`} position={[1.0 + w[0], 0.12, w[1]]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 8]} />
          <meshStandardMaterial {...matProps('#4a3018')} />
        </mesh>
      ))}

      {/* ===== Firewood stack ===== */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`fw-${i}`} castShadow position={[
          -1.5 + (i % 4) * 0.08,
          0.12 + Math.floor(i / 4) * 0.07,
          0.3 + Math.sin(i * 2.3) * 0.02
        ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.18, 4]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
      ))}

      {/* ===== Chicken coop ===== */}
      <mesh castShadow position={[1.3, 0.18, -1.0]}>
        <boxGeometry args={[0.3, 0.2, 0.25]} />
        <meshStandardMaterial {...matProps('#7c5c35')} />
      </mesh>
      <mesh castShadow position={[1.3, 0.32, -1.0]}>
        <boxGeometry args={[0.35, 0.06, 0.3]} />
        <meshStandardMaterial {...matProps('#c8a85a')} />
      </mesh>
      {/* Coop door */}
      <mesh position={[1.3, 0.13, -0.87]}>
        <boxGeometry args={[0.08, 0.1, 0.02]} />
        <meshStandardMaterial {...matProps('#3c2a0a')} />
      </mesh>

      {/* ===== Well ===== */}
      <mesh castShadow position={[1.2, 0.2, 0.2]}>
        <cylinderGeometry args={[0.14, 0.18, 0.3, 8]} />
        <meshStandardMaterial {...matProps('#7a7a7a')} />
      </mesh>
      {/* Well posts */}
      <mesh castShadow position={[1.12, 0.5, 0.2]}><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh castShadow position={[1.28, 0.5, 0.2]}><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      {/* Well crossbar */}
      <mesh castShadow position={[1.2, 0.72, 0.2]}><boxGeometry args={[0.22, 0.04, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      {/* Well roof */}
      <mesh castShadow position={[1.2, 0.8, 0.2]}>
        <coneGeometry args={[0.18, 0.15, 4]} />
        <meshStandardMaterial {...matProps('#c8a85a')} />
      </mesh>
    </group>
  )
}

// ============================================================================
// LIBRARY — Mead Hall / Lore House (Stave Church Style)
// ============================================================================
function LibraryModel({ matProps, isActive }: ModelProps) {
  const lanternRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    lanternRefs.forEach((ref, i) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.8 + Math.sin(t * 3 + i * 1.5) * 0.4
      }
    })
  })

  return (
    <group>
      {/* ===== Stone path leading to door ===== */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`path-${i}`} position={[0, 0.02, 1.0 + i * 0.25]} rotation={[-Math.PI / 2, Math.sin(i * 2.7) * 0.2, 0]}>
          <boxGeometry args={[0.3 + Math.sin(i * 3.1) * 0.08, 0.25, 0.02]} />
          <meshStandardMaterial color="#7a7a72" roughness={0.95} />
        </mesh>
      ))}

      {/* ===== Stone foundation ===== */}
      <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[2.6, 0.2, 1.8]} />
        <meshStandardMaterial {...matProps('#7a7a72', '#5a5a52', 0.03)} roughness={0.95} />
      </mesh>

      {/* ===== Main hall body (tall) ===== */}
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[2.2, 1.6, 1.4]} />
        <meshStandardMaterial {...matProps('#6b4a2a', '#4a3018', 0.08)} roughness={0.9} />
      </mesh>

      {/* ===== Vertical timber frame beams ===== */}
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => (
        <mesh key={`vbeam-${i}`} castShadow position={[x, 1.05, 0.71]}>
          <boxGeometry args={[0.06, 1.6, 0.04]} />
          <meshStandardMaterial {...matProps('#4a3018')} />
        </mesh>
      ))}

      {/* ===== Steep stave-church roof ===== */}
      {/* Lower roof layer */}
      <mesh castShadow position={[-0.55, 2.2, 0]} rotation={[0, 0, Math.PI / 3.5]}>
        <boxGeometry args={[1.5, 0.08, 1.6]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.04)} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.55, 2.2, 0]} rotation={[0, 0, -Math.PI / 3.5]}>
        <boxGeometry args={[1.5, 0.08, 1.6]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.04)} roughness={0.95} />
      </mesh>
      {/* Upper roof layer (narrower, steeper) */}
      <mesh castShadow position={[-0.3, 2.65, 0]} rotation={[0, 0, Math.PI / 3]}>
        <boxGeometry args={[0.9, 0.07, 1.3]} />
        <meshStandardMaterial {...matProps('#2d1b0a', '#1a0a00', 0.03)} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.3, 2.65, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <boxGeometry args={[0.9, 0.07, 1.3]} />
        <meshStandardMaterial {...matProps('#2d1b0a', '#1a0a00', 0.03)} roughness={0.95} />
      </mesh>
      {/* Ridge beam */}
      <mesh castShadow position={[0, 2.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>
      {/* Crossed beams at peaks */}
      {[0.9, -0.9].map((z, i) => (
        <group key={`xbeam-${i}`} position={[0, 2.7, z]}>
          <mesh rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial {...matProps('#4a3018')} />
          </mesh>
          <mesh rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial {...matProps('#4a3018')} />
          </mesh>
        </group>
      ))}

      {/* ===== Grand entrance with carved pillars ===== */}
      {/* Main pillars */}
      {[-0.35, 0.35].map((x, i) => (
        <group key={`pillar-${i}`}>
          <mesh castShadow position={[x, 0.75, 0.85]}>
            <cylinderGeometry args={[0.08, 0.1, 1.2, 8]} />
            <meshStandardMaterial {...matProps('#5c3d1e', '#3a2510', 0.05)} />
          </mesh>
          {/* Carved rings on pillar */}
          {[0.35, 0.55, 0.75, 0.95].map((y, j) => (
            <mesh key={`ring-${j}`} position={[x, y, 0.85]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
              <meshStandardMaterial {...matProps('#4a3018')} />
            </mesh>
          ))}
          {/* Pillar cap */}
          <mesh position={[x, 1.38, 0.85]}>
            <boxGeometry args={[0.18, 0.06, 0.18]} />
            <meshStandardMaterial {...matProps('#4a3018')} />
          </mesh>
        </group>
      ))}
      {/* Porch roof */}
      <mesh castShadow position={[0, 1.5, 0.95]}>
        <boxGeometry args={[0.9, 0.06, 0.35]} />
        <meshStandardMaterial {...matProps('#3d2b1a')} />
      </mesh>

      {/* ===== Door ===== */}
      <mesh position={[0, 0.6, 0.72]}>
        <boxGeometry args={[0.4, 0.85, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>
      {/* Door arch */}
      <mesh position={[0, 1.05, 0.72]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 8, 1, false, 0, Math.PI]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>

      {/* ===== Rune stones at entrance ===== */}
      {[[-0.6, 0, 1.2], [0.6, 0, 1.2]].map((p, i) => (
        <group key={`rune-${i}`}>
          <mesh castShadow position={[p[0], 0.25, p[2]]} rotation={[0, Math.sin(i * 3) * 0.2, 0]}>
            <boxGeometry args={[0.15, 0.45, 0.06]} />
            <meshStandardMaterial color="#6a6a62" roughness={0.9} />
          </mesh>
          {/* Glowing rune symbol */}
          {isActive && (
            <mesh position={[p[0], 0.3, p[2] + 0.04]}>
              <boxGeometry args={[0.06, 0.15, 0.01]} />
              <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={1.5} />
            </mesh>
          )}
        </group>
      ))}

      {/* ===== Windows with warm bookshelf glow ===== */}
      {isActive && [
        [1.11, 1.0, 0.3], [1.11, 1.0, -0.3],
        [-1.11, 1.0, 0.3], [-1.11, 1.0, -0.3],
      ].map((p, i) => (
        <group key={`libwin-${i}`}>
          {/* Window frame */}
          <mesh position={[p[0], p[1], p[2]]}>
            <boxGeometry args={[0.06, 0.35, 0.2]} />
            <meshStandardMaterial color="#e8a040" emissive="#e8a040" emissiveIntensity={0.8} transparent opacity={0.6} />
          </mesh>
          {/* Book shapes inside */}
          {Array.from({ length: 3 }).map((_, j) => (
            <mesh key={`book-${j}`} position={[p[0], p[1] - 0.1 + j * 0.08, p[2]]}>
              <boxGeometry args={[0.03, 0.06, 0.15]} />
              <meshStandardMaterial color={['#8b2020', '#1a4a8b', '#4a7c4e'][j]} emissive={['#8b2020', '#1a4a8b', '#4a7c4e'][j]} emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ===== Hanging lanterns at entrance ===== */}
      {[-0.35, 0.35].map((x, i) => (
        <group key={`lantern-${i}`}>
          {/* Chain */}
          <mesh position={[x, 1.35, 0.85]}>
            <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Lantern body */}
          <mesh ref={lanternRefs[i]} position={[x, 1.22, 0.85]}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
            <meshStandardMaterial color="#e8a040" emissive="#e8a040" emissiveIntensity={isActive ? 1.0 : 0.2} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ===== Decorative shields along walls ===== */}
      {[
        [1.12, 1.4, 0, '#8b2020'], [1.12, 1.4, 0.4, '#1a4a8b'], [1.12, 1.4, -0.4, '#c9a84c'],
        [-1.12, 1.4, 0, '#4a7c4e'], [-1.12, 1.4, 0.4, '#8b2020'], [-1.12, 1.4, -0.4, '#1a4a8b'],
      ].map((s, i) => (
        <mesh key={`lshield-${i}`} position={[s[0] as number, s[1] as number, s[2] as number]}
              rotation={[0, (s[0] as number) > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.025, 8]} />
          <meshStandardMaterial color={s[3] as string} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ===== Bench outside ===== */}
      <mesh castShadow position={[1.4, 0.18, 0]}>
        <boxGeometry args={[0.15, 0.04, 0.7]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[1.4, 0.1, -0.3]}><boxGeometry args={[0.1, 0.18, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh castShadow position={[1.4, 0.1, 0.3]}><boxGeometry args={[0.1, 0.18, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
    </group>
  )
}

// ============================================================================
// LAB — Völva's Tower / Seiðr Workshop
// ============================================================================
function LabModel({ matProps, isActive }: ModelProps) {
  const cauldronRef = useRef<THREE.Mesh>(null)
  const runeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cauldronRef.current) {
      cauldronRef.current.scale.y = 1 + Math.sin(t * 4) * 0.15
      cauldronRef.current.position.y = 0.55 + Math.sin(t * 3) * 0.02
    }
    if (runeRef.current) {
      runeRef.current.rotation.y = t * 0.3
      const mat = runeRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.5
    }
  })

  // Generate stone wall positions for round tower
  const wallStones = useMemo(() => {
    const stones: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number, number] }[] = []
    for (let row = 0; row < 10; row++) {
      const stonesInRow = 12 + row % 2
      for (let col = 0; col < stonesInRow; col++) {
        const angle = (col / stonesInRow) * Math.PI * 2 + (row % 2) * (Math.PI / stonesInRow)
        const r = 0.55
        const y = 0.3 + row * 0.16
        stones.push({
          pos: [Math.cos(angle) * r, y, Math.sin(angle) * r],
          rot: [0, -angle, Math.sin(col * 3.7 + row * 2.1) * 0.1],
          size: [0.2, 0.13 + Math.sin(col * 5.3) * 0.03, 0.12],
        })
      }
    }
    return stones
  }, [])

  return (
    <group>
      {/* ===== Round stone tower with visible stones ===== */}
      {/* Inner cylinder (solid core) */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 1.7, 10]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.05)} roughness={0.95} />
      </mesh>
      {/* Individual stones on the wall */}
      {wallStones.map((s, i) => (
        <mesh key={`ws-${i}`} position={s.pos} rotation={s.rot} castShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial {...matProps(
            i % 3 === 0 ? '#7a7a72' : i % 3 === 1 ? '#6a6a62' : '#8a8a82',
            '#4a4a42', 0.02
          )} roughness={0.95} />
        </mesh>
      ))}

      {/* ===== Conical shingled roof (overlapping layers) ===== */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`roof-${i}`} castShadow position={[0, 1.85 + i * 0.22, 0]}>
          <coneGeometry args={[0.7 - i * 0.12, 0.3, 8]} />
          <meshStandardMaterial {...matProps(
            i % 2 === 0 ? '#2a3a4a' : '#3a4a5a',
            '#1a2a3a', 0.05
          )} roughness={0.9} />
        </mesh>
      ))}
      {/* Roof peak spike */}
      <mesh castShadow position={[0, 2.8, 0]}>
        <coneGeometry args={[0.04, 0.2, 6]} />
        <meshStandardMaterial color="#4a4a4a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ===== Raven perched on roof ===== */}
      <group position={[0.1, 2.85, 0.05]}>
        {/* Body */}
        <mesh>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.04, 0.03]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 0.03, 0.06]}>
          <coneGeometry args={[0.008, 0.03, 3]} />
          <meshStandardMaterial color="#3a3a2a" />
        </mesh>
        {/* Wings */}
        <mesh position={[0.035, 0.01, -0.01]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.05, 0.01, 0.04]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[-0.035, 0.01, -0.01]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.05, 0.01, 0.04]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>

      {/* ===== Glowing crystals around base ===== */}
      {[
        [0.7, 0.15, 0.3, '#aa44ff'], [-0.65, 0.18, 0.4, '#44aaff'],
        [0.5, 0.12, -0.6, '#44ffaa'], [-0.4, 0.2, -0.65, '#ff44aa'],
        [0.75, 0.1, -0.2, '#aaff44'],
      ].map((c, i) => (
        <mesh key={`crystal-${i}`} castShadow position={[c[0] as number, c[1] as number, c[2] as number]}
              rotation={[Math.sin(i * 2.3) * 0.4, 0, Math.cos(i * 3.1) * 0.3]}>
          <octahedronGeometry args={[0.06 + i * 0.01, 0]} />
          <meshStandardMaterial color={c[3] as string} emissive={c[3] as string} emissiveIntensity={isActive ? 1.5 : 0.3} transparent opacity={0.8} />
        </mesh>
      ))}

      {/* ===== Bubbling cauldron outside ===== */}
      <group position={[0.8, 0, 0.5]}>
        {/* Tripod legs */}
        {[0, 2.1, 4.2].map((angle, i) => (
          <mesh key={`leg-${i}`} position={[Math.cos(angle) * 0.1, 0.15, Math.sin(angle) * 0.1]}
                rotation={[Math.sin(angle) * 0.3, 0, Math.cos(angle) * 0.3]}>
            <cylinderGeometry args={[0.012, 0.015, 0.3, 4]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        {/* Cauldron */}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Bubbling liquid */}
        <mesh ref={cauldronRef} position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.09, 8, 4]} />
          <meshStandardMaterial color="#44ff88" emissive="#22aa44" emissiveIntensity={1.0} transparent opacity={0.7} />
        </mesh>
        {isActive && <AnimatedSmoke position={[0, 0.35, 0]} color="#44ff88" scale={0.5} />}
      </group>

      {/* ===== Herb garden ===== */}
      {[
        [-0.8, 0, 0.4, '#4a8a2e'], [-0.7, 0, 0.55, '#8a4a8e'],
        [-0.9, 0, 0.3, '#8a8a2e'], [-0.6, 0, 0.65, '#2e4a8a'],
        [-0.85, 0, 0.5, '#8a2e4a'],
      ].map((h, i) => (
        <group key={`herb-${i}`} position={[h[0] as number, 0.08, h[2] as number]}>
          <mesh>
            <coneGeometry args={[0.04, 0.12, 4]} />
            <meshStandardMaterial color={h[3] as string} />
          </mesh>
          <mesh position={[0.02, -0.02, 0]}>
            <coneGeometry args={[0.03, 0.08, 3]} />
            <meshStandardMaterial color={h[3] as string} />
          </mesh>
        </group>
      ))}

      {/* ===== Mystical rune circle on ground ===== */}
      {isActive && (
        <mesh ref={runeRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.9, 16]} />
          <meshStandardMaterial color="#aa44ff" emissive="#aa44ff" emissiveIntensity={1.0} transparent opacity={0.5} />
        </mesh>
      )}
      {/* Rune symbols around circle */}
      {isActive && Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={`rsym-${i}`} position={[Math.cos(angle) * 0.85, 0.04, Math.sin(angle) * 0.85]}
                rotation={[-Math.PI / 2, 0, angle]}>
            <boxGeometry args={[0.04, 0.08, 0.01]} />
            <meshStandardMaterial color="#cc66ff" emissive="#cc66ff" emissiveIntensity={1.2} transparent opacity={0.6} />
          </mesh>
        )
      })}

      {/* ===== Colored smoke ===== */}
      {isActive && <AnimatedSmoke position={[0.3, 2.0, 0.3]} color="#9944cc" scale={0.6} />}

      {/* ===== Door ===== */}
      <mesh position={[0, 0.5, 0.58]}>
        <boxGeometry args={[0.28, 0.7, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>

      {/* ===== Windows with potion bottles ===== */}
      {isActive && [
        [0.57, 1.0, 0.2], [-0.2, 1.0, 0.57], [0.57, 1.0, -0.2]
      ].map((p, i) => (
        <group key={`labwin-${i}`}>
          <mesh position={[p[0], p[1], p[2]]}>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.6} transparent opacity={0.5} />
          </mesh>
          {/* Potion bottles on shelf */}
          <mesh position={[p[0], p[1] - 0.05, p[2]]}>
            <cylinderGeometry args={[0.015, 0.015, 0.06, 4]} />
            <meshStandardMaterial color={['#ff4444', '#44ff44', '#4444ff'][i]} emissive={['#ff4444', '#44ff44', '#4444ff'][i]} emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ============================================================================
// SERVER — Longhouse Data Center
// ============================================================================
function ServerModel({ matProps, isActive }: ModelProps) {
  const lightRefs = Array.from({ length: 6 }, () => useRef<THREE.Mesh>(null))
  const fanRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)]

  useFrame((state) => {
    if (!isActive) return
    const t = state.clock.elapsedTime
    lightRefs.forEach((ref, i) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 1.0 + Math.sin(t * 3 + i * 1.2) * 1.5
      }
    })
    fanRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.rotation.y = t * 8
      }
    })
  })

  return (
    <group>
      {/* ===== Stone foundation ===== */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[3.6, 0.2, 1.8]} />
        <meshStandardMaterial {...matProps('#7a7a72', '#5a5a52', 0.03)} roughness={0.95} />
      </mesh>

      {/* ===== Extra-long main body ===== */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[3.2, 1.2, 1.4]} />
        <meshStandardMaterial {...matProps('#6b4a2a', '#4a3018', 0.08)} roughness={0.9} />
      </mesh>

      {/* ===== Layered timber wall detail ===== */}
      {/* Horizontal log bands */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`hlog-${i}`} castShadow position={[0, 0.35 + i * 0.18, 0.71]}>
          <cylinderGeometry args={[0.04, 0.04, 3.2, 6]} />
          <meshStandardMaterial {...matProps(i % 2 === 0 ? '#5c3d1e' : '#6b4a2a')} />
        </mesh>
      ))}
      {/* Vertical post beams */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((x, i) => (
        <mesh key={`vpost-${i}`} castShadow position={[x, 0.85, 0.72]}>
          <boxGeometry args={[0.08, 1.2, 0.06]} />
          <meshStandardMaterial {...matProps('#4a3018')} />
        </mesh>
      ))}

      {/* ===== Thatched roof ===== */}
      <mesh castShadow position={[-0.45, 1.75, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[1.3, 0.08, 1.6]} />
        <meshStandardMaterial {...matProps('#a08040', '#806020', 0.05)} roughness={0.98} />
      </mesh>
      <mesh castShadow position={[0.45, 1.75, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.3, 0.08, 1.6]} />
        <meshStandardMaterial {...matProps('#a08040', '#806020', 0.05)} roughness={0.98} />
      </mesh>
      {/* Second thatch layer */}
      <mesh castShadow position={[-0.4, 1.82, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
        <meshStandardMaterial {...matProps('#c8a85a')} />
      </mesh>
      <mesh castShadow position={[0.4, 1.82, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
        <meshStandardMaterial {...matProps('#c8a85a')} />
      </mesh>
      {/* Ridge */}
      <mesh castShadow position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
        <meshStandardMaterial {...matProps('#4a3018')} />
      </mesh>

      {/* ===== Multiple chimneys with colored smoke ===== */}
      {[[-0.8, '#4488ff'], [0, '#44ff88'], [0.8, '#ff8844']].map((ch, i) => (
        <group key={`chimney-${i}`}>
          <mesh castShadow position={[ch[0] as number, 2.0, 0.3]}>
            <boxGeometry args={[0.15, 0.4, 0.15]} />
            <meshStandardMaterial {...matProps('#5a5a5a')} />
          </mesh>
          {isActive && <AnimatedSmoke position={[ch[0] as number, 2.3, 0.3]} color={ch[1] as string} scale={0.5} />}
        </group>
      ))}

      {/* ===== Row of windows with alternating glow ===== */}
      {isActive && Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`swin-${i}`} ref={lightRefs[i]} position={[-1.2 + i * 0.48, 0.8, 0.72]}>
          <boxGeometry args={[0.12, 0.18, 0.04]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#0088ff' : '#00ff88'}
            emissive={i % 2 === 0 ? '#0088ff' : '#00ff88'}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      {/* ===== External cable/rope runs between support poles ===== */}
      {[-1.0, 0, 1.0].map((x, i) => (
        <group key={`pole-${i}`}>
          <mesh castShadow position={[x, 0.8, -0.9]}>
            <cylinderGeometry args={[0.03, 0.035, 1.3, 4]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
        </group>
      ))}
      {/* Cables between poles */}
      <mesh position={[0, 1.3, -0.9]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.0, 0.015, 0.015]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[0, 1.2, -0.9]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.0, 0.015, 0.015]} />
        <meshStandardMaterial color="#2a4a6a" />
      </mesh>

      {/* ===== Cooling vents on roof with spinning fans ===== */}
      {fanRefs.map((ref, i) => (
        <group key={`fan-${i}`}>
          <mesh position={[-0.6 + i * 0.6, 1.95, -0.3]}>
            <boxGeometry args={[0.15, 0.08, 0.15]} />
            <meshStandardMaterial {...matProps('#5a5a5a')} />
          </mesh>
          {isActive && (
            <group ref={ref} position={[-0.6 + i * 0.6, 2.0, -0.3]}>
              {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, j) => (
                <mesh key={`fb-${j}`} rotation={[0, rot, 0]} position={[Math.cos(rot) * 0.04, 0, Math.sin(rot) * 0.04]}>
                  <boxGeometry args={[0.08, 0.01, 0.02]} />
                  <meshStandardMaterial color="#6a6a6a" metalness={0.5} roughness={0.4} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}

      {/* ===== Loading dock with crates ===== */}
      {/* Dock platform */}
      <mesh castShadow position={[1.8, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.15, 1.0]} />
        <meshStandardMaterial {...matProps('#7c5c35')} />
      </mesh>
      {/* Crates */}
      {[
        [1.75, 0.4, 0.2, 0.18], [1.85, 0.4, -0.15, 0.15], [1.78, 0.55, 0.1, 0.12],
      ].map((c, i) => (
        <mesh key={`crate-${i}`} castShadow position={[c[0], c[1], c[2]]}>
          <boxGeometry args={[c[3], c[3], c[3]]} />
          <meshStandardMaterial {...matProps('#7c5c35')} />
        </mesh>
      ))}

      {/* ===== Runic server rack visible through large window ===== */}
      {isActive && (
        <group position={[0, 0.7, 0.73]}>
          {/* Large window frame */}
          <mesh>
            <boxGeometry args={[0.6, 0.5, 0.04]} />
            <meshStandardMaterial color="#1a3a5a" emissive="#0a2a4a" emissiveIntensity={0.4} transparent opacity={0.5} />
          </mesh>
          {/* Server rack lines */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={`rack-${i}`} position={[-0.2 + i * 0.1, 0, 0.025]}>
              <boxGeometry args={[0.04, 0.4, 0.01]} />
              <meshStandardMaterial color="#0088ff" emissive="#0088ff" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* ===== Doors ===== */}
      <mesh position={[-1.3, 0.5, 0.72]}>
        <boxGeometry args={[0.35, 0.7, 0.04]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>
    </group>
  )
}

// ============================================================================
// BARRACKS — Training Grounds / War Lodge
// ============================================================================
function BarracksModel({ matProps, isActive }: ModelProps) {
  const fireRef = useRef<THREE.Mesh>(null)
  const flagRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (fireRef.current) {
      const mat = fireRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(t * 8) * 0.8
      fireRef.current.scale.y = 0.8 + Math.sin(t * 6) * 0.3
    }
    flagRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.rotation.y = Math.sin(t * 2 + i * 1.5) * 0.3
      }
    })
  })

  return (
    <group>
      {/* ===== Stone base ===== */}
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[3.4, 0.16, 3.4]} />
        <meshStandardMaterial {...matProps('#7a7a72', '#5a5a52', 0.03)} roughness={0.95} />
      </mesh>

      {/* ===== Thick stone and wood walls ===== */}
      {/* Front wall */}
      <mesh castShadow receiveShadow position={[0, 0.65, 1.4]}>
        <boxGeometry args={[2.8, 0.95, 0.25]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.08)} roughness={0.9} />
      </mesh>
      {/* Back wall */}
      <mesh castShadow receiveShadow position={[0, 0.65, -1.4]}>
        <boxGeometry args={[2.8, 0.95, 0.25]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.08)} roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh castShadow receiveShadow position={[-1.4, 0.65, 0]}>
        <boxGeometry args={[0.25, 0.95, 2.55]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.08)} roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh castShadow receiveShadow position={[1.4, 0.65, 0]}>
        <boxGeometry args={[0.25, 0.95, 2.55]} />
        <meshStandardMaterial {...matProps('#6a6a62', '#4a4a42', 0.08)} roughness={0.9} />
      </mesh>
      {/* Wood panel overlay on walls */}
      <mesh position={[0, 0.8, 1.42]}>
        <boxGeometry args={[2.4, 0.5, 0.04]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>

      {/* ===== Corner watchtowers with flags ===== */}
      {[
        [1.4, 0, 1.4], [-1.4, 0, 1.4], [1.4, 0, -1.4], [-1.4, 0, -1.4]
      ].map((p, i) => (
        <group key={`btower-${i}`}>
          {/* Tower base */}
          <mesh castShadow position={[p[0], 0.7, p[2]]}>
            <cylinderGeometry args={[0.25, 0.3, 1.2, 8]} />
            <meshStandardMaterial {...matProps('#7a7a72', '#5a5a52', 0.08)} roughness={0.9} />
          </mesh>
          {/* Battlements */}
          {Array.from({ length: 4 }).map((_, j) => {
            const a = (j / 4) * Math.PI * 2
            return (
              <mesh key={`bm-${j}`} position={[p[0] + Math.cos(a) * 0.2, 1.4, p[2] + Math.sin(a) * 0.2]}>
                <boxGeometry args={[0.08, 0.12, 0.08]} />
                <meshStandardMaterial {...matProps('#6a6a62')} />
              </mesh>
            )
          })}
          {/* Tower roof */}
          <mesh castShadow position={[p[0], 1.55, p[2]]}>
            <coneGeometry args={[0.3, 0.35, 8]} />
            <meshStandardMaterial {...matProps('#8b2020', '#5a1010', 0.1)} roughness={0.85} />
          </mesh>
          {/* Flag pole */}
          <mesh position={[p[0], 2.0, p[2]]}>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
            <meshStandardMaterial {...matProps('#4a3a2a')} />
          </mesh>
          {/* Flag */}
          <mesh ref={flagRefs[i]} position={[p[0] + 0.12, 2.2, p[2]]}>
            <boxGeometry args={[0.2, 0.12, 0.01]} />
            <meshStandardMaterial color={['#8b2020', '#c9a84c', '#1a4a8b', '#4a7c4e'][i]} />
          </mesh>
        </group>
      ))}

      {/* ===== Training dummies (multiple, varied) ===== */}
      {[
        [0.5, 0, 0.5], [-0.5, 0, 0.7], [0.8, 0, -0.3]
      ].map((d, i) => (
        <group key={`dummy-${i}`} position={[d[0], 0, d[2]]}>
          {/* Post */}
          <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.8, 4]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Crossbar */}
          <mesh castShadow position={[0, 0.7, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.05]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial {...matProps('#c8a85a')} />
          </mesh>
          {/* Target on body */}
          <mesh position={[0, 0.6, 0.04]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
            <meshStandardMaterial color="#8b2020" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ===== Weapon racks with swords, axes, shields ===== */}
      <group position={[-0.8, 0, -1.1]}>
        {/* Rack frame */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.12]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
        <mesh castShadow position={[-0.35, 0.2, 0]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
        <mesh castShadow position={[0.35, 0.2, 0]}><boxGeometry args={[0.04, 0.3, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
        {/* Swords */}
        {[-0.2, -0.05, 0.1].map((x, i) => (
          <mesh key={`sword-${i}`} position={[x, 0.55, 0]} rotation={[0, 0, 0.05 * (i - 1)]}>
            <boxGeometry args={[0.02, 0.4, 0.01]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        {/* Axe */}
        <mesh position={[0.25, 0.55, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.02, 0.35, 0.01]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
        <mesh position={[0.28, 0.7, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.015]} />
          <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* ===== Shield rack on wall ===== */}
      {[
        [0.3, 0.7, -1.38, '#8b2020'], [0.6, 0.7, -1.38, '#1a4a8b'], [0.9, 0.7, -1.38, '#c9a84c']
      ].map((s, i) => (
        <mesh key={`wshield-${i}`} position={[s[0] as number, s[1] as number, s[2] as number]}>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 8]} />
          <meshStandardMaterial color={s[3] as string} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}

      {/* ===== Central fire pit with bonfire ===== */}
      <group position={[0, 0, 0]}>
        {/* Stone ring */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.3, 10]} />
          <meshStandardMaterial color="#5a5a52" roughness={0.9} />
        </mesh>
        {/* Logs in pit */}
        {[0, 0.7, 1.4, 2.1].map((angle, i) => (
          <mesh key={`pitlog-${i}`} position={[Math.cos(angle) * 0.08, 0.15, Math.sin(angle) * 0.08]}
                rotation={[0.3, angle, 0.2]}>
            <cylinderGeometry args={[0.025, 0.03, 0.2, 4]} />
            <meshStandardMaterial {...matProps('#3a2510')} />
          </mesh>
        ))}
        {/* Big animated bonfire */}
        <mesh ref={fireRef} position={[0, 0.35, 0]}>
          <coneGeometry args={[0.15, 0.4, 6]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} transparent opacity={0.85} />
        </mesh>
        {isActive && <AnimatedFire position={[0, 0.25, 0]} scale={1.2} />}
      </group>

      {/* ===== Archery target ===== */}
      <group position={[0.9, 0, -0.8]}>
        <mesh castShadow position={[0, 0.5, 0]} rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="#c8a85a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0.03]} rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.5, 0.04]} rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshStandardMaterial color="#8b2020" />
        </mesh>
        <mesh position={[0, 0.5, 0.05]} rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.5} />
        </mesh>
        {/* Support post */}
        <mesh position={[0, 0.25, -0.05]}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
      </group>

      {/* ===== Sparring ring marked on ground ===== */}
      <mesh position={[0.3, 0.02, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.55, 16]} />
        <meshStandardMaterial color="#a08860" roughness={0.95} />
      </mesh>

      {/* ===== Armor stands ===== */}
      {[[-1.0, 0, 0.5], [-1.0, 0, -0.5]].map((a, i) => (
        <group key={`armor-${i}`} position={[a[0], 0, a[2]]}>
          {/* Stand */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.05, 0.5, 4]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Crossbar */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.25, 0.04, 0.04]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Armor plate */}
          <mesh position={[0, 0.4, 0.03]}>
            <boxGeometry args={[0.15, 0.2, 0.02]} />
            <meshStandardMaterial color="#6a6a6a" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ===== War drums near entrance ===== */}
      {[[-0.4, 0, 1.1], [0.4, 0, 1.1]].map((d, i) => (
        <group key={`drum-${i}`}>
          <mesh castShadow position={[d[0], 0.2, d[2]]}>
            <cylinderGeometry args={[0.1, 0.12, 0.25, 8]} />
            <meshStandardMaterial {...matProps('#5c3d1e')} />
          </mesh>
          {/* Drum skin */}
          <mesh position={[d[0], 0.33, d[2]]}>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 8]} />
            <meshStandardMaterial color="#c8a85a" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* ===== Gate opening ===== */}
      <mesh position={[0, 0.45, 1.43]}>
        <boxGeometry args={[0.5, 0.65, 0.06]} />
        <meshStandardMaterial {...matProps('#3c2a0a', '#1a0a00', 0.1)} />
      </mesh>

      {/* ===== Trophy wall (back) ===== */}
      {/* Mounted antlers */}
      <group position={[0, 0.9, -1.38]}>
        <mesh rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.01, 0.02, 0.2, 4]} />
          <meshStandardMaterial color="#c8b890" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.01, 0.02, 0.2, 4]} />
          <meshStandardMaterial color="#c8b890" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

// ============================================================================
// DEFAULT
// ============================================================================
function DefaultModel({ matProps, isActive }: ModelProps) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial {...matProps('#7c5c35', '#5c3d1e', 0.1)} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <coneGeometry args={[0.9, 0.5, 4]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      {isActive && (
        <mesh position={[0, 0.35, 0.61]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}
