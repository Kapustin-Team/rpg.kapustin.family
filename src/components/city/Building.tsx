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
}> = {
  tower:   { color: '#2a3a5c', emissive: '#1a2440', height: 3.0, width: 1.2, depth: 1.2, roofColor: '#f4c542' },
  farm:    { color: '#4a6c3c', emissive: '#2a3c1c', height: 0.8, width: 2.0, depth: 1.5, roofColor: '#84cc16' },
  library: { color: '#3c3060', emissive: '#1c1040', height: 1.8, width: 1.5, depth: 1.5, roofColor: '#7c3aed' },
  lab:     { color: '#1a4a5c', emissive: '#0a2a3c', height: 1.5, width: 1.2, depth: 1.2, roofColor: '#06b6d4' },
  server:  { color: '#1a2a1a', emissive: '#0a1a0a', height: 1.2, width: 1.0, depth: 1.0, roofColor: '#10b981' },
  market:  { color: '#5c3a1a', emissive: '#3c2a0a', height: 1.0, width: 1.8, depth: 1.8, roofColor: '#f97316' },
  default: { color: '#2a3a4c', emissive: '#1a2a3c', height: 1.2, width: 1.2, depth: 1.2, roofColor: '#6b7280' },
}

interface BuildingProps {
  building: BuildingType
}

export function Building({ building }: BuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedBuilding, setIsPanelOpen } = useGameStore()

  const config = BUILDING_CONFIGS[building.type] || BUILDING_CONFIGS.default
  const isConstructing = building.status === 'under_construction'
  const isPlanned = building.status === 'planned'

  const opacity = isPlanned ? 0.3 : isConstructing ? 0.6 : 1.0
  const scaleY = isConstructing ? (building.constructionProgress / 100) : 1.0

  useFrame((state) => {
    if (!meshRef.current) return
    if (hovered) {
      meshRef.current.position.y = building.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05 + 0.05
    } else {
      meshRef.current.position.y = building.position[1]
    }
  })

  const handleClick = () => {
    setSelectedBuilding(building.id)
    setIsPanelOpen(true)
  }

  return (
    <group position={building.position}>
      {/* Основное здание */}
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
          color={hovered ? '#ffffff' : config.color}
          emissive={config.emissive}
          emissiveIntensity={hovered ? 0.3 : 0.1}
          transparent
          opacity={opacity}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Крыша */}
      {!isPlanned && (
        <mesh position={[0, config.height * scaleY + 0.2, 0]} castShadow>
          <coneGeometry args={[config.width * 0.7, 0.4, 4]} />
          <meshStandardMaterial
            color={config.roofColor}
            emissive={config.roofColor}
            emissiveIntensity={0.2}
            transparent
            opacity={opacity}
          />
        </mesh>
      )}

      {/* Окна (только у активных) */}
      {building.status === 'active' && (
        <>
          <mesh position={[config.width / 2 + 0.01, config.height * 0.6, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshStandardMaterial color={config.roofColor} emissive={config.roofColor} emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[-config.width / 2 - 0.01, config.height * 0.6, 0]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshStandardMaterial color={config.roofColor} emissive={config.roofColor} emissiveIntensity={0.8} />
          </mesh>
        </>
      )}

      {/* Прогресс стройки */}
      {isConstructing && (
        <Html position={[0, config.height + 0.8, 0]} center distanceFactor={8}>
          <div style={{
            background: 'rgba(10,15,26,0.9)',
            border: '1px solid #f4c542',
            borderRadius: 4,
            padding: '2px 8px',
            color: '#f4c542',
            fontSize: 11,
            whiteSpace: 'nowrap',
          }}>
            🏗️ {building.constructionProgress}%
          </div>
        </Html>
      )}

      {/* Название при наведении */}
      {hovered && (
        <Text
          position={[0, config.height + 0.6, 0]}
          fontSize={0.2}
          color="#f4c542"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#0a0f1a"
        >
          {building.name}
        </Text>
      )}

      {/* Тень-основание */}
      <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.width + 0.2, config.depth + 0.2]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}
