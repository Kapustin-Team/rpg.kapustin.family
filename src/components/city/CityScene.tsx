'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Grid } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import * as THREE from 'three'
import { Building } from './Building'
import { Ground } from './Ground'
import { useGameStore } from '@/store/gameStore'

export default function CityScene() {
  const { buildings, tickResources, loadFromStrapi, isLoaded } = useGameStore()

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
