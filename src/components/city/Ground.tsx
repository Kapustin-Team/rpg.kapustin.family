'use client'

export function Ground() {
  return (
    <>
      {/* Основная земля */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#0d1a0d"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Дороги */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[1.0, 30]} />
        <meshStandardMaterial color="#1a1a2a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.001, 0]}>
        <planeGeometry args={[1.0, 30]} />
        <meshStandardMaterial color="#1a1a2a" roughness={1} />
      </mesh>

      {/* Центральная площадь */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial color="#1a2040" roughness={0.8} />
      </mesh>
    </>
  )
}
