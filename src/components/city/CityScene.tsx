'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Cloud, Grid } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'
import { Building } from './Building'
import { Ground } from './Ground'
import { AgentCharacter } from './AgentCharacter'
import { WASDControls } from './WASDControls'
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
        scene.background = new THREE.Color('#87CEEB')
      }}
    >
      <Suspense fallback={null}>
        {/* Bright Nordic daytime sky */}
        <Sky
          distance={450000}
          sunPosition={[100, 20, 100]}
          inclination={0.5}
          azimuth={0.25}
          turbidity={4}
          rayleigh={0.5}
        />

        {/* Bright daytime lighting */}
        <ambientLight intensity={1.2} color="#fff8f0" />

        <directionalLight
          position={[15, 30, 15]}
          intensity={2.5}
          color="#ffe8c0"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={80}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />

        {/* Sky/ground color bounce */}
        <hemisphereLight args={["#87CEEB", "#4a7c35", 0.6]} />

        {/* Clouds */}
        <Cloud position={[-20, 18, -20]} speed={0.1} opacity={0.6} />
        <Cloud position={[25, 22, 10]} speed={0.08} opacity={0.5} />

        {/* Ground */}
        <Ground />

        {/* Subtle grid overlay */}
        <Grid
          args={[30, 30]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.2}
          cellColor="#4a7c35"
          sectionSize={4}
          sectionThickness={0.5}
          sectionColor="#5a8a3c"
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
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={4}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
        <WASDControls />
      </Suspense>
    </Canvas>
  )
}
