'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky, Stars, Grid, Environment } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import { Building } from './Building'
import { Ground } from './Ground'
import { useGameStore } from '@/store/gameStore'

export default function CityScene() {
  const { buildings, tickResources, loadFromStrapi, isLoaded } = useGameStore()

  // Грузим данные из Strapi при старте
  useEffect(() => {
    if (!isLoaded) loadFromStrapi()
  }, [isLoaded, loadFromStrapi])

  // Тикаем ресурсы каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(tickResources, 5000)
    return () => clearInterval(interval)
  }, [tickResources])

  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
      camera={{ position: [12, 10, 12], fov: 50 }}
      shadows
    >
      <Suspense fallback={null}>
        {/* Освещение */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.3} color="#7c3aed" />
        <pointLight position={[5, 3, 5]} intensity={0.2} color="#06b6d4" />

        {/* Небо и звёзды */}
        <Sky sunPosition={[10, 5, 10]} turbidity={8} rayleigh={2} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

        {/* Земля */}
        <Ground />

        {/* Сетка */}
        <Grid
          args={[30, 30]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.3}
          cellColor="#1a2540"
          sectionSize={4}
          sectionThickness={0.8}
          sectionColor="#243060"
          fadeDistance={25}
          infiniteGrid
        />

        {/* Постройки */}
        {buildings.map((building) => (
          <Building key={building.id} building={building} />
        ))}

        {/* Управление камерой */}
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
