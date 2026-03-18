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

      {/* Status light */}
      {isActive && (
        <mesh position={[0.5, 0.3, 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#84cc16"
            emissive="#84cc16"
            emissiveIntensity={2.0}
          />
        </mesh>
      )}
      {isConstructing && (
        <mesh position={[0.5, 0.3, 0.5]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#eab308"
            emissive="#eab308"
            emissiveIntensity={2.0}
          />
        </mesh>
      )}

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
        <meshStandardMaterial color="#000000" transparent opacity={0.25} />
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
  return (
    <group>
      {/* Base platform */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial {...matProps('#8b7355', '#5c4a2a', 0.1)} />
      </mesh>
      {/* Tower body */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[1.4, 2.6, 1.4]} />
        <meshStandardMaterial {...matProps('#c9a84c', '#7c5c3e', 0.15)} />
      </mesh>
      {/* Narrower top section */}
      <mesh castShadow receiveShadow position={[0, 3.1, 0]}>
        <boxGeometry args={[1.0, 0.6, 1.0]} />
        <meshStandardMaterial {...matProps('#d4b85c', '#8b7355', 0.2)} />
      </mesh>
      {/* 4 battlements */}
      {[[0.55, 0, 0.55], [-0.55, 0, 0.55], [0.55, 0, -0.55], [-0.55, 0, -0.55]].map((p, i) => (
        <mesh key={i} castShadow position={[p[0], 3.6, p[2]]}>
          <boxGeometry args={[0.25, 0.35, 0.25]} />
          <meshStandardMaterial {...matProps('#a08040', '#5c4a2a', 0.1)} />
        </mesh>
      ))}
      {/* Flag pole */}
      <mesh castShadow position={[0, 3.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
        <meshStandardMaterial {...matProps('#4a3a2a')} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.2, 4.3, 0]}>
        <boxGeometry args={[0.4, 0.25, 0.02]} />
        <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={0.5} />
      </mesh>
      {/* Windows */}
      {isActive && (
        <>
          <mesh position={[0.71, 1.8, 0]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial color="#e8c97e" emissive="#e8c97e" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[-0.71, 1.8, 0]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial color="#e8c97e" emissive="#e8c97e" emissiveIntensity={1.2} />
          </mesh>
        </>
      )}
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.35, 0.71]}>
          <planeGeometry args={[0.35, 0.5]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function FarmModel({ matProps, isActive }: ModelProps) {
  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.6, 0.2, 2.0]} />
        <meshStandardMaterial {...matProps('#3a5c2a', '#1a3a15', 0.05)} />
      </mesh>
      {/* Main barn body */}
      <mesh castShadow receiveShadow position={[0, 0.65, 0]}>
        <boxGeometry args={[2.0, 0.9, 1.4]} />
        <meshStandardMaterial {...matProps('#2d5a27', '#1a3a15', 0.1)} />
      </mesh>
      {/* Pitched roof (two angled planes) */}
      <mesh castShadow position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
        <meshStandardMaterial {...matProps('#4a7c3c', '#2d5a27', 0.1)} />
      </mesh>
      <mesh castShadow position={[0, 1.3, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[1.2, 0.05, 1.5]} />
        <meshStandardMaterial {...matProps('#4a7c3c', '#2d5a27', 0.1)} />
      </mesh>
      {/* Fence posts */}
      {[[1.1, 0, 0.8], [-1.1, 0, 0.8], [1.1, 0, -0.8], [-1.1, 0, -0.8]].map((p, i) => (
        <mesh key={`post-${i}`} castShadow position={[p[0], 0.4, p[2]]}>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
          <meshStandardMaterial {...matProps('#5c4a2a')} />
        </mesh>
      ))}
      {/* Fence rails */}
      <mesh position={[1.1, 0.35, 0]}><boxGeometry args={[0.04, 0.04, 1.6]} /><meshStandardMaterial {...matProps('#5c4a2a')} /></mesh>
      <mesh position={[-1.1, 0.35, 0]}><boxGeometry args={[0.04, 0.04, 1.6]} /><meshStandardMaterial {...matProps('#5c4a2a')} /></mesh>
      <mesh position={[0, 0.35, 0.8]}><boxGeometry args={[2.2, 0.04, 0.04]} /><meshStandardMaterial {...matProps('#5c4a2a')} /></mesh>
      <mesh position={[0, 0.35, -0.8]}><boxGeometry args={[2.2, 0.04, 0.04]} /><meshStandardMaterial {...matProps('#5c4a2a')} /></mesh>
      {/* Hay bale */}
      <mesh castShadow position={[0.7, 0.3, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 8]} />
        <meshStandardMaterial {...matProps('#c9a84c', '#8b7355', 0.1)} />
      </mesh>
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.4, 0.71]}>
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
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.0]} />
        <meshStandardMaterial {...matProps('#5c4a2a', '#3c2a0a', 0.05)} />
      </mesh>
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[1.6, 1.8, 1.6]} />
        <meshStandardMaterial {...matProps('#7c5c3e', '#3c2a0a', 0.1)} />
      </mesh>
      {/* 4 columns */}
      {[[0.65, 0, 0.65], [-0.65, 0, 0.65], [0.65, 0, -0.65], [-0.65, 0, -0.65]].map((p, i) => (
        <mesh key={i} castShadow position={[p[0], 1.0, p[2]]}>
          <cylinderGeometry args={[0.08, 0.1, 1.8, 8]} />
          <meshStandardMaterial {...matProps('#a08060', '#5c4a2a', 0.1)} />
        </mesh>
      ))}
      {/* Pediment / roof cap */}
      <mesh castShadow position={[0, 2.3, 0]}>
        <coneGeometry args={[1.3, 0.7, 4]} />
        <meshStandardMaterial {...matProps('#5c3a1a', '#3c2a0a', 0.1)} />
      </mesh>
      {/* Window glow */}
      {isActive && (
        <mesh position={[0.81, 1.3, 0]}>
          <planeGeometry args={[0.01, 0.5]} />
          <meshStandardMaterial color="#e8c97e" emissive="#e8c97e" emissiveIntensity={1.5} />
        </mesh>
      )}
      {/* Door */}
      {isActive && (
        <mesh position={[0, 0.4, 0.81]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function LabModel({ matProps, isActive }: ModelProps) {
  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.0, 0.2, 1.8]} />
        <meshStandardMaterial {...matProps('#1a3a5c', '#0a2a4c', 0.05)} />
      </mesh>
      {/* Main body */}
      <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[1.3, 1.5, 1.3]} />
        <meshStandardMaterial {...matProps('#2a4a6c', '#0a2a4c', 0.15)} />
      </mesh>
      {/* Glowing windows */}
      {isActive && (
        <>
          <mesh position={[0.66, 1.2, 0.2]}>
            <planeGeometry args={[0.01, 0.3]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
          </mesh>
          <mesh position={[0.66, 1.2, -0.2]}>
            <planeGeometry args={[0.01, 0.3]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
          </mesh>
        </>
      )}
      {/* Antenna */}
      <mesh castShadow position={[0.3, 2.2, 0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
        <meshStandardMaterial {...matProps('#6b7280')} />
      </mesh>
      <mesh position={[0.3, 2.75, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.0} />
      </mesh>
      {/* Exhaust pipes */}
      <mesh castShadow position={[0.5, 1.5, 0.66]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial {...matProps('#4a4a4a', '#2a2a2a', 0.1)} />
      </mesh>
      <mesh castShadow position={[-0.5, 1.5, 0.66]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial {...matProps('#4a4a4a', '#2a2a2a', 0.1)} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[1.5, 0.1, 1.5]} />
        <meshStandardMaterial {...matProps('#1a3a5c', '#0a2a4c', 0.1)} />
      </mesh>
    </group>
  )
}

function ServerModel({ matProps, isActive }: ModelProps) {
  const lightRef1 = useRef<THREE.Mesh>(null)
  const lightRef2 = useRef<THREE.Mesh>(null)
  const lightRef3 = useRef<THREE.Mesh>(null)
  const lightRef4 = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!isActive) return
    const t = state.clock.elapsedTime
    const refs = [lightRef1, lightRef2, lightRef3, lightRef4]
    refs.forEach((ref, i) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = Math.sin(t * 3 + i * 1.5) > 0 ? 3.0 : 0.5
      }
    })
  })

  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.0, 0.2, 1.6]} />
        <meshStandardMaterial {...matProps('#3a3a3a', '#1a1a1a', 0.05)} />
      </mesh>
      {/* Main rack body */}
      <mesh castShadow receiveShadow position={[0, 0.85, 0]}>
        <boxGeometry args={[1.6, 1.3, 1.1]} />
        <meshStandardMaterial {...matProps('#4a4a4a', '#2a2a2a', 0.1)} />
      </mesh>
      {/* Server blades */}
      {[0.55, 0.85, 1.15].map((y, i) => (
        <mesh key={i} position={[0, y, 0.01]}>
          <boxGeometry args={[1.3, 0.18, 0.9]} />
          <meshStandardMaterial
            color="#3a3a5c"
            transparent
            opacity={0.7}
            roughness={0.3}
            metalness={0.3}
          />
        </mesh>
      ))}
      {/* 4 indicator lights */}
      <mesh ref={lightRef1} position={[0.6, 0.55, 0.56]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#84cc16" emissive="#84cc16" emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={lightRef2} position={[0.6, 0.85, 0.56]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={lightRef3} position={[0.6, 1.15, 0.56]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#84cc16" emissive="#84cc16" emissiveIntensity={2.0} />
      </mesh>
      <mesh ref={lightRef4} position={[-0.6, 0.85, 0.56]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={2.0} />
      </mesh>
      {/* Top */}
      <mesh castShadow position={[0, 1.55, 0]}>
        <boxGeometry args={[1.7, 0.1, 1.2]} />
        <meshStandardMaterial {...matProps('#3a3a3a', '#1a1a1a', 0.05)} />
      </mesh>
    </group>
  )
}

function BarracksModel({ matProps, isActive }: ModelProps) {
  return (
    <group>
      {/* Base */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[2.6, 0.2, 2.6]} />
        <meshStandardMaterial {...matProps('#4a2a1a', '#2a1a0a', 0.05)} />
      </mesh>
      {/* Thick walls (4 segments) */}
      <mesh castShadow receiveShadow position={[0, 0.8, 1.1]}>
        <boxGeometry args={[2.4, 1.2, 0.2]} />
        <meshStandardMaterial {...matProps('#6b1a1a', '#3a0a0a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.8, -1.1]}>
        <boxGeometry args={[2.4, 1.2, 0.2]} />
        <meshStandardMaterial {...matProps('#6b1a1a', '#3a0a0a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.1, 0.8, 0]}>
        <boxGeometry args={[0.2, 1.2, 2.0]} />
        <meshStandardMaterial {...matProps('#6b1a1a', '#3a0a0a', 0.1)} />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.1, 0.8, 0]}>
        <boxGeometry args={[0.2, 1.2, 2.0]} />
        <meshStandardMaterial {...matProps('#6b1a1a', '#3a0a0a', 0.1)} />
      </mesh>
      {/* Round corner towers */}
      <mesh castShadow position={[1.1, 1.0, 1.1]}>
        <cylinderGeometry args={[0.25, 0.3, 1.8, 8]} />
        <meshStandardMaterial {...matProps('#8b2a2a', '#5c1a1a', 0.15)} />
      </mesh>
      <mesh castShadow position={[-1.1, 1.0, -1.1]}>
        <cylinderGeometry args={[0.25, 0.3, 1.8, 8]} />
        <meshStandardMaterial {...matProps('#8b2a2a', '#5c1a1a', 0.15)} />
      </mesh>
      {/* Battlements */}
      {[[-0.8, 0, 1.1], [-0.2, 0, 1.1], [0.4, 0, 1.1], [0.8, 0, -1.1], [0.2, 0, -1.1], [-0.4, 0, -1.1]].map((p, i) => (
        <mesh key={i} castShadow position={[p[0], 1.55, p[2]]}>
          <boxGeometry args={[0.2, 0.3, 0.22]} />
          <meshStandardMaterial {...matProps('#6b1a1a', '#3a0a0a', 0.1)} />
        </mesh>
      ))}
      {/* Gate opening hint (door) */}
      {isActive && (
        <mesh position={[0, 0.4, 1.21]}>
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
        <meshStandardMaterial {...matProps('#4a3a2a', '#2a1a0a', 0.1)} />
      </mesh>
      <mesh castShadow position={[0, 1.5, 0]}>
        <coneGeometry args={[0.9, 0.5, 4]} />
        <meshStandardMaterial {...matProps('#6b7280', '#4a4a4a', 0.1)} />
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
