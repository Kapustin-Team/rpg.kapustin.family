'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { Building } from './Building'
import { Ground } from './Ground'
import { AgentCharacter } from './AgentCharacter'
import { useGameStore } from '@/store/gameStore'
import { BUILDING_TEMPLATES } from '@/data/buildings'

function PlacementGhost() {
  const buildingPlacementType = useGameStore((s) => s.buildingPlacementType)
  const placeBuilding = useGameStore((s) => s.placeBuilding)
  const setBuildingPlacementType = useGameStore((s) => s.setBuildingPlacementType)
  const meshRef = useRef<THREE.Mesh>(null)
  const [ghostPos, setGhostPos] = useState<[number, number, number]>([0, 0, 0])

  const template = BUILDING_TEMPLATES.find((t) => t.type === buildingPlacementType)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBuildingPlacementType(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setBuildingPlacementType])

  if (!buildingPlacementType || !template) return null

  return (
    <>
      {/* Invisible ground plane for raycasting */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => {
          e.stopPropagation()
          const snap = (v: number) => Math.round(v * 2) / 2
          setGhostPos([snap(e.point.x), 0, snap(e.point.z)])
        }}
        onClick={(e) => {
          e.stopPropagation()
          placeBuilding(buildingPlacementType, ghostPos)
          setBuildingPlacementType(null)
        }}
      >
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Ghost building preview */}
      <mesh ref={meshRef} position={[ghostPos[0], 0.6, ghostPos[2]]}>
        <boxGeometry args={[1.4, 1.2, 1.4]} />
        <meshStandardMaterial
          color={template.color}
          transparent
          opacity={0.4}
          emissive={template.color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </>
  )
}

export default function CityScene() {
  const { buildings, tickResources, loadFromStrapi, isLoaded } = useGameStore()
  const agents = useGameStore((s) => s.agents)

  useEffect(() => {
    if (!isLoaded) loadFromStrapi()
  }, [isLoaded, loadFromStrapi])

  useEffect(() => {
    const interval = setInterval(tickResources, 5000)
    return () => clearInterval(interval)
  }, [tickResources])

  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
      camera={{ position: [12, 10, 12], fov: 50 }}
      shadows
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#0d1117', 20, 50)
        scene.background = new THREE.Color('#0d1117')
      }}
    >
      <Suspense fallback={null}>
        {/* Ambient — dark blue moonlight */}
        <ambientLight intensity={0.3} color="#1a237e" />

        {/* Directional — warm moonlight */}
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.0}
          color="#ffe4b5"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />

        {/* Campfire point light near HQ */}
        <pointLight position={[0, 2, 1]} intensity={1.5} color="#c9a84c" distance={12} decay={2} />
        <pointLight position={[0, 0.5, 0.5]} intensity={0.8} color="#e8c97e" distance={6} decay={2} />

        {/* Accent lights */}
        <pointLight position={[-6, 3, -4]} intensity={0.2} color="#2d5a27" distance={10} />
        <pointLight position={[5, 3, 5]} intensity={0.15} color="#1a237e" distance={10} />

        {/* Stars — night sky */}
        <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade speed={0.3} />

        {/* Ground */}
        <Ground />

        {/* Subtle grid overlay */}
        <Grid
          args={[30, 30]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.2}
          cellColor="#1a2e1a"
          sectionSize={4}
          sectionThickness={0.5}
          sectionColor="#2d5a27"
          fadeDistance={20}
          infiniteGrid
        />

        {/* Buildings */}
        {buildings.map((building) => (
          <Building key={building.id} building={building} />
        ))}

        {/* Agents */}
        {agents.map((agent) => (
          <AgentCharacter key={agent.id} agent={agent} />
        ))}

        {/* Placement mode */}
        <PlacementGhost />

        {/* Camera controls */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={4}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
      </Suspense>
    </Canvas>
  )
}
