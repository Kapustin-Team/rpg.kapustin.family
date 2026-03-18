'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Building as BuildingType } from '@/store/gameStore'
import { useGameStore } from '@/store/gameStore'

const BUILDING_CONFIGS: Record<string, {
  color: string
  emissive: string
  height: number
  width: number
  depth: number
  roofColor: string
  roofHeight: number
}> = {
  tower:   { color: '#c9a84c', emissive: '#7c5c3e', height: 3.0, width: 1.4, depth: 1.4, roofColor: '#8b1a1a', roofHeight: 1.0 },
  farm:    { color: '#2d5a27', emissive: '#1a3a15', height: 0.9, width: 2.2, depth: 1.6, roofColor: '#4a7c3c', roofHeight: 0.6 },
  library: { color: '#7c5c3e', emissive: '#3c2a0a', height: 1.8, width: 1.6, depth: 1.6, roofColor: '#5c3a1a', roofHeight: 0.7 },
  lab:     { color: '#2a4a6c', emissive: '#0a2a4c', height: 1.5, width: 1.3, depth: 1.3, roofColor: '#1a3a5c', roofHeight: 0.6 },
  server:  { color: '#4a4a4a', emissive: '#2a2a2a', height: 1.2, width: 1.1, depth: 1.1, roofColor: '#6b7280', roofHeight: 0.5 },
  market:  { color: '#7c5c3e', emissive: '#5c3a1a', height: 1.0, width: 2.0, depth: 2.0, roofColor: '#c9a84c', roofHeight: 0.7 },
  default: { color: '#4a3a2a', emissive: '#2a1a0a', height: 1.2, width: 1.2, depth: 1.2, roofColor: '#6b7280', roofHeight: 0.5 },
}

interface BuildingProps {
  building: BuildingType
}

export function Building({ building }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedBuilding, setIsPanelOpen } = useGameStore()

  const config = BUILDING_CONFIGS[building.type] || BUILDING_CONFIGS.default
  const isConstructing = building.status === 'under_construction'
  const isPlanned = building.status === 'planned'

  const opacity = isPlanned ? 0.3 : isConstructing ? 0.6 : 1.0
  const scaleY = isConstructing ? (building.constructionProgress / 100) : 1.0

  useFrame((state) => {
    if (!groupRef.current) return
    // Gentle sway on Y axis (sin wave, 0.3 deg max)
    const swayAngle = Math.sin(state.clock.elapsedTime * 0.8 + building.position[0]) * 0.005
    groupRef.current.rotation.y = swayAngle

    // Hover bob
    if (meshRef.current) {
      if (hovered) {
        meshRef.current.position.y = (config.height * scaleY) / 2 + Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.05
      } else {
        meshRef.current.position.y = (config.height * scaleY) / 2
      }
    }
  })

  const handleClick = () => {
    setSelectedBuilding(building.id)
    setIsPanelOpen(true)
  }

  return (
    <group position={building.position} ref={groupRef}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        position={[0, (config.height * scaleY) / 2, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <boxGeometry args={[config.width, config.height * scaleY, config.depth]} />
        <meshStandardMaterial
          color={hovered ? '#e8c97e' : config.color}
          emissive={hovered ? '#c9a84c' : config.emissive}
          emissiveIntensity={hovered ? 0.5 : 0.15}
          transparent
          opacity={opacity}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Roof — cone on top (North Gard style) */}
      {!isPlanned && (
        <mesh
          position={[0, config.height * scaleY + config.roofHeight / 2, 0]}
          castShadow
        >
          <coneGeometry args={[
            Math.max(config.width, config.depth) * 0.75,
            config.roofHeight,
            4
          ]} />
          <meshStandardMaterial
            color={config.roofColor}
            emissive={config.roofColor}
            emissiveIntensity={hovered ? 0.3 : 0.1}
            transparent
            opacity={opacity}
            roughness={0.9}
          />
        </mesh>
      )}

      {/* Windows — warm glow (active buildings only) */}
      {building.status === 'active' && (
        <>
          <mesh position={[config.width / 2 + 0.01, config.height * 0.55, 0]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial
              color="#e8c97e"
              emissive="#e8c97e"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[-config.width / 2 - 0.01, config.height * 0.55, 0]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial
              color="#e8c97e"
              emissive="#e8c97e"
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh position={[0, config.height * 0.55, config.depth / 2 + 0.01]}>
            <planeGeometry args={[0.25, 0.3]} />
            <meshStandardMaterial
              color="#e8c97e"
              emissive="#e8c97e"
              emissiveIntensity={1.0}
            />
          </mesh>
        </>
      )}

      {/* Door */}
      {building.status === 'active' && (
        <mesh position={[0, 0.25, config.depth / 2 + 0.01]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial color="#3c2a0a" emissive="#1a0a00" emissiveIntensity={0.2} />
        </mesh>
      )}

      {/* Construction progress */}
      {isConstructing && (
        <Html position={[0, config.height + 0.8, 0]} center distanceFactor={8}>
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
          position={[0, config.height + config.roofHeight + 0.3, 0]}
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
        <planeGeometry args={[config.width + 0.4, config.depth + 0.4]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}
