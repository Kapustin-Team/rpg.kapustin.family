'use client'

import { useRef, useState } from 'react'
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

function HQModel({ matProps, isActive }: ModelProps) {
  const flagRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group>
      {/* Stone base platform */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.8, 0.2, 2.8]} />
        <meshStandardMaterial {...matProps('#8a8a8a', '#5a5a5a', 0.05)} />
      </mesh>
      {/* Main keep body */}
      <mesh castShadow receiveShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[1.8, 2.2, 1.8]} />
        <meshStandardMaterial {...matProps('#6a6a6a', '#4a4a4a', 0.1)} />
      </mesh>
      {/* Roof - steep pitched */}
      <mesh castShadow position={[0, 2.7, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.5, 1.0, 4]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
      </mesh>
      {/* Corner towers */}
      {[
        [1.0, 0, 1.0], [-1.0, 0, 1.0], [1.0, 0, -1.0], [-1.0, 0, -1.0]
      ].map((p, i) => (
        <group key={`tower-${i}`}>
          <mesh castShadow position={[p[0], 1.1, p[2]]}>
            <cylinderGeometry args={[0.25, 0.3, 2.0, 8]} />
            <meshStandardMaterial {...matProps('#7a7a7a', '#5a5a5a', 0.1)} />
          </mesh>
          <mesh castShadow position={[p[0], 2.3, p[2]]}>
            <coneGeometry args={[0.35, 0.5, 8]} />
            <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
          </mesh>
        </group>
      ))}
      {/* Gate arch */}
      <mesh castShadow position={[0.25, 0.6, 0.91]}>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <meshStandardMaterial {...matProps('#5a5a5a')} />
      </mesh>
      <mesh castShadow position={[-0.25, 0.6, 0.91]}>
        <boxGeometry args={[0.1, 1.0, 0.1]} />
        <meshStandardMaterial {...matProps('#5a5a5a')} />
      </mesh>
      <mesh castShadow position={[0, 1.15, 0.91]}>
        <boxGeometry args={[0.6, 0.12, 0.12]} />
        <meshStandardMaterial {...matProps('#5a5a5a')} />
      </mesh>
      {/* Flag pole + flag */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
        <meshStandardMaterial {...matProps('#4a3a2a')} />
      </mesh>
      <mesh ref={flagRef} position={[0.2, 4.0, 0]}>
        <boxGeometry args={[0.4, 0.25, 0.02]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.6} />
      </mesh>
      {/* Window slots */}
      {[
        [0.91, 1.5, 0.3], [0.91, 1.5, -0.3],
        [-0.91, 1.5, 0.3], [-0.91, 1.5, -0.3],
        [0.3, 1.5, 0.91], [-0.3, 1.5, 0.91],
      ].map((p, i) => (
        <mesh key={`win-${i}`} position={[p[0], p[1], p[2]]}>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color="#1a1a2a" emissive={isActive ? '#e8c97e' : '#000'} emissiveIntensity={isActive ? 0.8 : 0} />
        </mesh>
      ))}
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.45, 0.92]}>
          <planeGeometry args={[0.4, 0.7]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function FarmModel({ matProps, isActive }: ModelProps) {
  const windmillRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (windmillRef.current) {
      windmillRef.current.rotation.z = state.clock.elapsedTime * 0.5
    }
  })

  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[3.0, 0.2, 2.4]} />
        <meshStandardMaterial {...matProps('#5a8a3c', '#3a5a2a', 0.05)} />
      </mesh>
      {/* Barn body */}
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[2.0, 1.1, 1.5]} />
        <meshStandardMaterial {...matProps('#7c5c35', '#5c3d1e', 0.1)} />
      </mesh>
      {/* Double-pitched roof */}
      <mesh castShadow position={[-0.3, 1.55, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[1.3, 0.06, 1.6]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      <mesh castShadow position={[0.3, 1.55, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.3, 0.06, 1.6]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      {/* Small house */}
      <mesh castShadow receiveShadow position={[-1.1, 0.5, 0.4]}>
        <boxGeometry args={[0.7, 0.7, 0.6]} />
        <meshStandardMaterial {...matProps('#8b7355', '#5c4a2a', 0.1)} />
      </mesh>
      <mesh castShadow position={[-1.1, 0.95, 0.4]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.5, 0.04, 0.7]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      {/* Well */}
      <mesh castShadow position={[1.0, 0.3, -0.6]}>
        <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} />
        <meshStandardMaterial {...matProps('#7a7a7a')} />
      </mesh>
      <mesh castShadow position={[1.0, 0.6, -0.6]}>
        <boxGeometry args={[0.04, 0.25, 0.35]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[1.0, 0.73, -0.6]}>
        <boxGeometry args={[0.35, 0.04, 0.04]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      {/* Fence posts */}
      {[
        [1.3, 0, 0.9], [-1.3, 0, 0.9], [1.3, 0, -0.9], [-1.3, 0, -0.9],
        [0, 0, 0.9], [0, 0, -0.9], [1.3, 0, 0], [-1.3, 0, 0],
      ].map((p, i) => (
        <mesh key={`post-${i}`} castShadow position={[p[0], 0.35, p[2]]}>
          <boxGeometry args={[0.05, 0.5, 0.05]} />
          <meshStandardMaterial {...matProps('#5c3d1e')} />
        </mesh>
      ))}
      {/* Fence rails */}
      <mesh position={[1.3, 0.35, 0]}><boxGeometry args={[0.04, 0.04, 1.8]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[-1.3, 0.35, 0]}><boxGeometry args={[0.04, 0.04, 1.8]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[0, 0.35, 0.9]}><boxGeometry args={[2.6, 0.04, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      <mesh position={[0, 0.35, -0.9]}><boxGeometry args={[2.6, 0.04, 0.04]} /><meshStandardMaterial {...matProps('#5c3d1e')} /></mesh>
      {/* Hay bales */}
      {[
        [0.6, 0.28, 0.5],
        [0.3, 0.28, 0.6],
        [-0.5, 0.28, -0.4],
      ].map((p, i) => (
        <mesh key={`hay-${i}`} castShadow position={[p[0], p[1], p[2]]} rotation={[Math.PI / 2, i * 0.5, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 8]} />
          <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.15)} />
        </mesh>
      ))}
      {/* Windmill */}
      <mesh castShadow position={[1.2, 0.8, 0.6]}>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
        <meshStandardMaterial {...matProps('#8b7355')} />
      </mesh>
      <group ref={windmillRef} position={[1.2, 1.4, 0.75]}>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
          <mesh key={`blade-${i}`} rotation={[0, 0, rot]} position={[Math.cos(rot) * 0.25, Math.sin(rot) * 0.25, 0]}>
            <boxGeometry args={[0.06, 0.5, 0.02]} />
            <meshStandardMaterial {...matProps('#c8a85a')} />
          </mesh>
        ))}
      </group>
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.45, 0.76]}>
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function LibraryModel({ matProps, isActive }: ModelProps) {
  return (
    <group>
      {/* Long rectangular base */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[2.8, 0.3, 1.8]} />
        <meshStandardMaterial {...matProps('#8a7a6a', '#5a4a3a', 0.05)} />
      </mesh>
      {/* Main hall body */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[2.4, 1.4, 1.5]} />
        <meshStandardMaterial {...matProps('#8a7a6a', '#5a4a3a', 0.1)} />
      </mesh>
      {/* Steep Viking-style long roof */}
      <mesh castShadow position={[-0.4, 2.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.4, 0.06, 1.6]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
      </mesh>
      <mesh castShadow position={[0.4, 2.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[1.4, 0.06, 1.6]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
      </mesh>
      {/* End gable decorations - triangles */}
      <mesh castShadow position={[0, 2.15, 0.8]}>
        <coneGeometry args={[0.6, 0.9, 3]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
      </mesh>
      <mesh castShadow position={[0, 2.15, -0.8]}>
        <coneGeometry args={[0.6, 0.9, 3]} />
        <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
      </mesh>
      {/* Entrance porch - 2 posts + small roof */}
      <mesh castShadow position={[0.25, 0.7, 0.95]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 6]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[-0.25, 0.7, 0.95]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 6]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[0, 1.3, 1.05]}>
        <boxGeometry args={[0.8, 0.06, 0.3]} />
        <meshStandardMaterial {...matProps('#3d2b1a')} />
      </mesh>
      {/* Decorative carved post at entrance */}
      <mesh castShadow position={[0, 0.9, 1.1]}>
        <cylinderGeometry args={[0.04, 0.05, 1.5, 6]} />
        <meshStandardMaterial {...matProps('#8b2020', '#5a1010', 0.2)} />
      </mesh>
      {/* Windows with orange glow */}
      {isActive && (
        <>
          {[
            [1.21, 1.1, 0.3], [1.21, 1.1, -0.3],
            [-1.21, 1.1, 0.3], [-1.21, 1.1, -0.3],
          ].map((p, i) => (
            <mesh key={`win-${i}`} position={[p[0], p[1], p[2]]}>
              <planeGeometry args={[0.01, 0.4]} />
              <meshStandardMaterial color="#e8a040" emissive="#e8a040" emissiveIntensity={1.2} />
            </mesh>
          ))}
        </>
      )}
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.5, 0.91]}>
          <planeGeometry args={[0.35, 0.7]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function LabModel({ matProps, isActive }: ModelProps) {
  const smokeRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (smokeRef.current) {
      const t = state.clock.elapsedTime
      smokeRef.current.scale.setScalar(0.8 + Math.sin(t * 2) * 0.3)
      smokeRef.current.position.y = 2.8 + Math.sin(t * 1.5) * 0.1
    }
  })

  return (
    <group>
      {/* Stone tower base */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <meshStandardMaterial {...matProps('#7a8a8a', '#4a5a5a', 0.1)} />
      </mesh>
      {/* Conical witch-hat roof */}
      <mesh castShadow position={[0, 2.2, 0]}>
        <coneGeometry args={[1.1, 1.2, 8]} />
        <meshStandardMaterial {...matProps('#2a3a4a', '#1a2a3a', 0.1)} />
      </mesh>
      {/* Glowing windows */}
      {isActive && (
        <>
          <mesh position={[0.81, 0.9, 0.25]}>
            <planeGeometry args={[0.01, 0.35]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.81, 0.9, -0.25]}>
            <planeGeometry args={[0.01, 0.35]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[-0.81, 0.9, 0]}>
            <planeGeometry args={[0.01, 0.35]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}
      {/* Chimney */}
      <mesh castShadow position={[0.5, 2.2, 0.5]}>
        <cylinderGeometry args={[0.1, 0.12, 0.6, 6]} />
        <meshStandardMaterial {...matProps('#5a5a5a')} />
      </mesh>
      {/* Smoke */}
      <mesh ref={smokeRef} position={[0.5, 2.8, 0.5]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#aaaaaa" transparent opacity={0.3} />
      </mesh>
      {/* Antenna */}
      <mesh castShadow position={[-0.4, 2.6, -0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial {...matProps('#6b7280')} />
      </mesh>
      <mesh position={[-0.4, 3.05, -0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.0} />
      </mesh>
      {/* Barrel props outside */}
      <mesh castShadow position={[1.0, 0.2, 0.6]}>
        <cylinderGeometry args={[0.12, 0.14, 0.35, 8]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[1.2, 0.2, 0.3]}>
        <cylinderGeometry args={[0.1, 0.12, 0.3, 8]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.4, 0.81]}>
          <planeGeometry args={[0.35, 0.6]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function ServerModel({ matProps, isActive }: ModelProps) {
  const lightRef1 = useRef<THREE.Mesh>(null)
  const lightRef2 = useRef<THREE.Mesh>(null)
  const lightRef3 = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!isActive) return
    const t = state.clock.elapsedTime
    const refs = [lightRef1, lightRef2, lightRef3]
    refs.forEach((ref, i) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 1.0 + Math.sin(t * 3 + i * 2.0) * 2.0
      }
    })
  })

  return (
    <group>
      {/* Long low base */}
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[3.0, 0.3, 1.6]} />
        <meshStandardMaterial {...matProps('#8a7a6a', '#5a4a3a', 0.05)} />
      </mesh>
      {/* Main longhouse body */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[2.6, 1.1, 1.3]} />
        <meshStandardMaterial {...matProps('#7c5c35', '#5c3d1e', 0.1)} />
      </mesh>
      {/* Thatched roof - steep pitch */}
      <mesh castShadow position={[-0.35, 1.7, 0]} rotation={[0, 0, Math.PI / 5]}>
        <boxGeometry args={[1.2, 0.06, 1.4]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      <mesh castShadow position={[0.35, 1.7, 0]} rotation={[0, 0, -Math.PI / 5]}>
        <boxGeometry args={[1.2, 0.06, 1.4]} />
        <meshStandardMaterial {...matProps('#c8a85a', '#a08040', 0.1)} />
      </mesh>
      {/* Side extension/wing */}
      <mesh castShadow receiveShadow position={[1.5, 0.6, 0]}>
        <boxGeometry args={[0.8, 0.7, 1.0]} />
        <meshStandardMaterial {...matProps('#7c5c35', '#5c3d1e', 0.1)} />
      </mesh>
      <mesh castShadow position={[1.5, 1.05, 0]}>
        <boxGeometry args={[0.9, 0.1, 1.1]} />
        <meshStandardMaterial {...matProps('#c8a85a')} />
      </mesh>
      {/* Exhaust vents on roof */}
      {[[-0.5, 2.0, 0], [0, 2.05, 0], [0.5, 2.0, 0]].map((p, i) => (
        <mesh key={`vent-${i}`} castShadow position={[p[0], p[1], p[2]]}>
          <cylinderGeometry args={[0.06, 0.08, 0.2, 6]} />
          <meshStandardMaterial {...matProps('#5a5a5a')} />
        </mesh>
      ))}
      {/* Blue indicator lights (blinking) */}
      <mesh ref={lightRef1} position={[0.4, 0.6, 0.66]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={lightRef2} position={[0, 0.6, 0.66]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={lightRef3} position={[-0.4, 0.6, 0.66]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={2.0} />
      </mesh>
      {/* Large entrance doors */}
      {isActive && (
        <mesh position={[0, 0.5, 0.66]}>
          <planeGeometry args={[0.6, 0.7]} />
          <meshStandardMaterial color="#5c3d1e" emissive="#3c2a0a" emissiveIntensity={0.15} />
        </mesh>
      )}
    </group>
  )
}

function BarracksModel({ matProps, isActive }: ModelProps) {
  const fireRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (fireRef.current) {
      const t = state.clock.elapsedTime
      const mat = fireRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(t * 8) * 0.8
      fireRef.current.scale.y = 0.8 + Math.sin(t * 6) * 0.3
    }
  })

  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[3.0, 0.2, 3.0]} />
        <meshStandardMaterial {...matProps('#8a7a6a', '#5a4a3a', 0.05)} />
      </mesh>
      {/* Stone wall segments forming courtyard */}
      <mesh castShadow receiveShadow position={[0, 0.7, 1.2]}>
        <boxGeometry args={[2.6, 1.0, 0.25]} />
        <meshStandardMaterial {...matProps('#7a7a7a', '#5a5a5a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.7, -1.2]}>
        <boxGeometry args={[2.6, 1.0, 0.25]} />
        <meshStandardMaterial {...matProps('#7a7a7a', '#5a5a5a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.2, 0.7, 0]}>
        <boxGeometry args={[0.25, 1.0, 2.15]} />
        <meshStandardMaterial {...matProps('#7a7a7a', '#5a5a5a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.2, 0.7, 0]}>
        <boxGeometry args={[0.25, 1.0, 2.15]} />
        <meshStandardMaterial {...matProps('#7a7a7a', '#5a5a5a', 0.1)} />
      </mesh>
      {/* Corner watchtowers */}
      {[
        [1.2, 0, 1.2], [-1.2, 0, 1.2], [1.2, 0, -1.2], [-1.2, 0, -1.2]
      ].map((p, i) => (
        <group key={`tower-${i}`}>
          <mesh castShadow position={[p[0], 0.9, p[2]]}>
            <cylinderGeometry args={[0.22, 0.28, 1.6, 8]} />
            <meshStandardMaterial {...matProps('#8b2020', '#5a1010', 0.15)} />
          </mesh>
          <mesh castShadow position={[p[0], 1.85, p[2]]}>
            <coneGeometry args={[0.3, 0.4, 8]} />
            <meshStandardMaterial {...matProps('#3d2b1a', '#2a1a0a', 0.05)} />
          </mesh>
        </group>
      ))}
      {/* Training dummy (cross shape) */}
      <mesh castShadow position={[0.3, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 4]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      <mesh castShadow position={[0.3, 0.8, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      {/* Fire pit */}
      <mesh position={[-0.3, 0.22, 0.3]}>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 8]} />
        <meshStandardMaterial color="#4a4a4a" />
      </mesh>
      <mesh ref={fireRef} position={[-0.3, 0.4, 0.3]}>
        <coneGeometry args={[0.12, 0.3, 6]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} transparent opacity={0.85} />
      </mesh>
      {/* Weapon rack */}
      <mesh castShadow position={[-0.5, 0.45, -0.6]}>
        <boxGeometry args={[0.5, 0.06, 0.1]} />
        <meshStandardMaterial {...matProps('#5c3d1e')} />
      </mesh>
      {[-0.65, -0.5, -0.35].map((x, i) => (
        <mesh key={`weapon-${i}`} castShadow position={[x, 0.6, -0.6]} rotation={[0, 0, 0.1 * (i - 1)]}>
          <boxGeometry args={[0.03, 0.35, 0.03]} />
          <meshStandardMaterial {...matProps('#8a8a8a')} />
        </mesh>
      ))}
      {/* Gate opening */}
      {isActive && (
        <mesh position={[0, 0.4, 1.33]}>
          <planeGeometry args={[0.5, 0.6]} />
          <meshStandardMaterial color="#1a0a00" emissive="#1a0a00" emissiveIntensity={0.1} />
        </mesh>
      )}
    </group>
  )
}

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
