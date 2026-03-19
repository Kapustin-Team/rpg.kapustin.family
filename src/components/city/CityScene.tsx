'use client'

import { useRef, useState, useEffect } from 'react'
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

/* Right-click ground plane for agent movement */
function GroundClickPlane() {
  const { selectedAgentId, moveAgentTo, moveAgentToBuilding, buildings } = useGameStore()

  return (
    <mesh
      position={[0, 0.001, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onContextMenu={(e) => {
        e.stopPropagation()
        if (!selectedAgentId) return
        const snap = (v: number) => Math.round(v * 2) / 2
        const targetPos: [number, number, number] = [snap(e.point.x), 0, snap(e.point.z)]

        // Check if right-clicked near a building
        const nearBuilding = buildings.find(b => {
          const dx = Math.abs(b.position[0] - targetPos[0])
          const dz = Math.abs(b.position[2] - targetPos[2])
          return dx < 1.5 && dz < 1.5
        })

        if (nearBuilding) {
          moveAgentToBuilding(selectedAgentId, nearBuilding.id)
        } else {
          moveAgentTo(selectedAgentId, targetPos)
        }
      }}
    >
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

/* Destination markers for moving agents */
function DestinationMarkers() {
  const agents = useGameStore((s) => s.agents)
  const movingAgents = agents.filter(a => a.status === 'moving' && a.targetPosition)

  return (
    <>
      {movingAgents.map(agent => agent.targetPosition && (
        <PulsingMarker key={agent.id} position={agent.targetPosition} color={agent.color} />
      ))}
    </>
  )
}

function PulsingMarker({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  const { clock } = useThree()

  useEffect(() => {
    const animate = () => {
      if (ref.current) {
        const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.3
        ref.current.scale.set(scale, scale, 1)
      }
    }
    // Just a one-time setup, the actual animation happens in the render loop
    return () => {}
  }, [clock])

  return (
    <mesh ref={ref} position={[position[0], 0.03, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.3, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function CityScene() {
  const { buildings, tickResources, loadFromStrapi, isLoaded, editMode } = useGameStore()
  const agents = useGameStore((s) => s.agents)

  useEffect(() => {
    if (!isLoaded) loadFromStrapi()
  }, [isLoaded, loadFromStrapi])

  useEffect(() => {
    const interval = setInterval(tickResources, 5000)
    return () => clearInterval(interval)
  }, [tickResources])

  // ESC exits edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editMode) {
        useGameStore.getState().setEditMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editMode])

  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
      camera={{ position: [12, 10, 12], fov: 50 }}
      shadows
      onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color('#0f172a')
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
      }}
      // Prevent default context menu on canvas
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={null}>
        {/* Night-ish tech sky */}
        <Sky
          distance={450000}
          sunPosition={[100, 20, 100]}
          inclination={0.5}
          azimuth={0.25}
          turbidity={8}
          rayleigh={0.5}
        />

        {/* Modern lighting setup */}
        <ambientLight intensity={0.8} color="#e0eeff" />

        <directionalLight
          position={[15, 30, 15]}
          intensity={2}
          color="#fff0e0"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={80}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />

        {/* Cool fill light */}
        <directionalLight
          position={[-10, 10, -10]}
          intensity={0.5}
          color="#0ea5e9"
        />

        <hemisphereLight args={['#87CEEB', '#2d5a27', 0.4]} />

        {/* Clouds */}
        <Cloud position={[-20, 18, -20]} speed={0.1} opacity={0.4} />
        <Cloud position={[25, 22, 10]} speed={0.08} opacity={0.3} />

        {/* Ground + environment */}
        <Ground />

        {/* Grid overlay — more prominent in edit mode */}
        <Grid
          args={[40, 40]}
          position={[0, 0.02, 0]}
          cellSize={0.5}
          cellThickness={editMode ? 0.6 : 0.15}
          cellColor={editMode ? '#0ea5e9' : '#1e3a5f'}
          sectionSize={2}
          sectionThickness={editMode ? 1 : 0.3}
          sectionColor={editMode ? '#22d3ee' : '#2d5a27'}
          fadeDistance={editMode ? 30 : 15}
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

        {/* Ground click plane for right-click movement */}
        <GroundClickPlane />

        {/* Destination markers */}
        <DestinationMarkers />

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
