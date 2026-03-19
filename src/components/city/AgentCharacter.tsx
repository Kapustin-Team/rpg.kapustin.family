"use client"
import { useRef, useState, useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, Billboard } from "@react-three/drei"
import { useGameStore } from "@/store/gameStore"
import type { Agent } from "@/data/agents"
import * as THREE from "three"

interface Props { agent: Agent }

// Unique accessories per agent
function AgentAccessory({ agentId, color }: { agentId: string; color: string }) {
  switch (agentId) {
    case 'milena':
      // Crown / tiara
      return (
        <group position={[0, 1.02, 0]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.12, 0.04, 8]} />
            <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Crown points */}
          {Array.from({ length: 5 }).map((_, i) => {
            const angle = (i / 5) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(angle) * 0.12, 0.05, Math.sin(angle) * 0.12]}>
                <coneGeometry args={[0.02, 0.06, 4]} />
                <meshStandardMaterial color="#c9a84c" metalness={0.8} roughness={0.2} />
              </mesh>
            )
          })}
          {/* Gem */}
          <mesh position={[0, 0.04, 0.12]}>
            <octahedronGeometry args={[0.02, 0]} />
            <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )
    case 'aleksandra':
      // Hammer (developer's tool)
      return (
        <group position={[-0.22, 0.4, 0.05]} rotation={[0, 0, -0.3]}>
          {/* Handle */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.015, 0.018, 0.25, 4]} />
            <meshStandardMaterial color="#5c3d1e" roughness={0.8} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.08, 0.04, 0.04]} />
            <meshStandardMaterial color="#8a8a8a" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      )
    case 'kristina':
      // Candy cane / lollipop
      return (
        <group position={[0.22, 0.5, 0.05]}>
          {/* Stick */}
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.15, 4]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Candy swirl */}
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.035, 8, 6]} />
            <meshStandardMaterial color="#ff66aa" emissive="#ff44aa" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.038, 8, 6, 0, Math.PI]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        </group>
      )
    case 'danijela':
      // Book / tome
      return (
        <group position={[-0.2, 0.45, 0.08]}>
          <mesh rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.1, 0.12, 0.03]} />
            <meshStandardMaterial color="#4a2020" roughness={0.7} />
          </mesh>
          {/* Pages */}
          <mesh position={[0, 0, 0.005]} rotation={[0, 0.3, 0.1]}>
            <boxGeometry args={[0.08, 0.1, 0.02]} />
            <meshStandardMaterial color="#f0e8d0" />
          </mesh>
        </group>
      )
    case 'jovana':
      // Wristband / fitness tracker
      return (
        <group position={[0.17, 0.42, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.025, 8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.4} roughness={0.3} />
          </mesh>
          {/* Screen */}
          <mesh position={[0, 0, 0.04]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.03, 0.015, 0.008]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

// Footstep dust particle system
function FootstepDust({ position, active }: { position: THREE.Vector3; active: boolean }) {
  const particles = useRef<THREE.Group>(null)
  const particleData = useMemo(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      offset: [Math.sin(i * 1.7) * 0.08, 0, Math.cos(i * 2.3) * 0.08] as [number, number, number],
      speed: 0.3 + Math.sin(i * 3.1) * 0.15,
      phase: i * 0.4,
    }))
  , [])

  useFrame((state) => {
    if (!particles.current || !active) return
    const t = state.clock.elapsedTime
    particles.current.children.forEach((child, i) => {
      const data = particleData[i]
      const life = (t * data.speed + data.phase) % 1.0
      child.position.y = life * 0.15
      child.scale.setScalar(0.5 + life * 0.5)
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
      mat.opacity = Math.max(0, 0.3 - life * 0.4)
    })
  })

  if (!active) return null

  return (
    <group ref={particles} position={[position.x, 0.02, position.z]}>
      {particleData.map((d, i) => (
        <mesh key={i} position={d.offset}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial color="#a08860" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  )
}

export function AgentCharacter({ agent }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyGroupRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

  const [wanderTarget, setWanderTarget] = useState<[number, number]>([agent.position[0], agent.position[2]])
  const [isMoving, setIsMoving] = useState(false)
  const selectedAgentId = useGameStore((s) => s.selectedAgentId)
  const setSelectedAgent = useGameStore((s) => s.setSelectedAgent)
  const isSelected = selectedAgentId === agent.id

  const posRef = useRef(new THREE.Vector3(...agent.position))

  // Darker shade of agent color for cloak
  const cloakColor = agent.color.replace(/[0-9a-f]{2}/gi, (hex: string) =>
    Math.max(0, parseInt(hex, 16) - 40).toString(16).padStart(2, '0')
  )

  useEffect(() => {
    if (agent.status !== "idle") return
    const tick = () => {
      setWanderTarget([(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10])
    }
    tick()
    const id = setInterval(tick, 3000 + Math.random() * 4000)
    return () => clearInterval(id)
  }, [agent.status])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    if (agent.status === "working") {
      if (bodyGroupRef.current) {
        bodyGroupRef.current.rotation.x = 0.3
        bodyGroupRef.current.position.y = 0.1 + Math.sin(t * 3) * 0.03
      }
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.8 + Math.sin(t * 6) * 0.4
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.3
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0
      setIsMoving(false)
    } else if (agent.status === "idle") {
      const dx = wanderTarget[0] - groupRef.current.position.x
      const dz = wanderTarget[1] - groupRef.current.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist > 0.15) {
        groupRef.current.position.x += (dx / dist) * delta * 0.8
        groupRef.current.position.z += (dz / dist) * delta * 0.8
        groupRef.current.rotation.y = Math.atan2(dx, dz)
        setIsMoving(true)
        posRef.current.copy(groupRef.current.position)

        const walkSpeed = 4
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.6
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * walkSpeed) * 0.6
        if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * walkSpeed) * 0.5
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.5
        if (bodyGroupRef.current) {
          bodyGroupRef.current.position.y = Math.abs(Math.sin(t * walkSpeed * 2)) * 0.04
          bodyGroupRef.current.rotation.x = 0.05 // slight lean forward while walking
          bodyGroupRef.current.rotation.z = Math.sin(t * walkSpeed) * 0.03 // body sway
        }
      } else {
        setIsMoving(false)
        if (torsoRef.current) torsoRef.current.scale.y = 1 + Math.sin(t * 1.2) * 0.02
        if (headRef.current) headRef.current.rotation.z = Math.sin(t * 0.8) * 0.05
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 0.9) * 0.1
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.1) * 0.1
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0
        if (bodyGroupRef.current) {
          bodyGroupRef.current.position.y = 0
          bodyGroupRef.current.rotation.x = 0
          bodyGroupRef.current.rotation.z = 0
        }
      }
    }
  })

  const statusBubble = agent.status === "working" ? "⚙️" : agent.status === "done" ? "✅" : "💬"

  return (
    <group
      ref={groupRef}
      position={agent.position}
      onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent.id) }}
    >
      {/* Footstep dust */}
      <FootstepDust position={posRef.current} active={isMoving} />

      {/* Body group */}
      <group ref={bodyGroupRef}>
        {/* ===== TORSO with more detail ===== */}
        <mesh ref={torsoRef} castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.22, 0.35, 0.14]} />
          <meshStandardMaterial
            color={agent.color}
            roughness={0.4}
            emissive={isSelected ? agent.color : "#000000"}
            emissiveIntensity={isSelected ? 0.4 : 0}
          />
        </mesh>

        {/* Belt */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.24, 0.04, 0.16]} />
          <meshStandardMaterial color="#4a3018" roughness={0.6} />
        </mesh>
        {/* Belt buckle */}
        <mesh position={[0, 0.4, 0.085]}>
          <boxGeometry args={[0.04, 0.03, 0.01]} />
          <meshStandardMaterial color="#c9a84c" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Shoulder pads */}
        <mesh castShadow position={[0.14, 0.72, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
          <meshStandardMaterial color={cloakColor} roughness={0.5} />
        </mesh>
        <mesh castShadow position={[-0.14, 0.72, 0]}>
          <boxGeometry args={[0.1, 0.06, 0.16]} />
          <meshStandardMaterial color={cloakColor} roughness={0.5} />
        </mesh>
        {/* Shoulder pad studs */}
        {[0.14, -0.14].map((x, i) => (
          <mesh key={`stud-${i}`} position={[x, 0.755, 0.06]}>
            <sphereGeometry args={[0.012, 4, 4]} />
            <meshStandardMaterial color="#c9a84c" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}

        {/* Collar / neckline */}
        <mesh position={[0, 0.73, 0.02]}>
          <boxGeometry args={[0.15, 0.03, 0.1]} />
          <meshStandardMaterial color={cloakColor} roughness={0.5} />
        </mesh>

        {/* Cloak (behind torso) */}
        <mesh castShadow position={[0, 0.55, -0.09]}>
          <boxGeometry args={[0.26, 0.38, 0.04]} />
          <meshStandardMaterial color={cloakColor} roughness={0.5} />
        </mesh>
        {/* Cloak bottom flap */}
        <mesh position={[0, 0.32, -0.1]}>
          <boxGeometry args={[0.28, 0.1, 0.03]} />
          <meshStandardMaterial color={cloakColor} roughness={0.6} />
        </mesh>

        {/* ===== HEAD with more detail ===== */}
        <mesh ref={headRef} castShadow position={[0, 0.87, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.2]} />
          <meshStandardMaterial color="#f0c8a0" roughness={0.5} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.06, 0.9, 0.1]}>
          <boxGeometry args={[0.04, 0.02, 0.01]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[-0.06, 0.9, 0.1]}>
          <boxGeometry args={[0.04, 0.02, 0.01]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 0.86, 0.105]}>
          <boxGeometry args={[0.03, 0.03, 0.02]} />
          <meshStandardMaterial color="#e0b890" roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh castShadow position={[0, 1.0, 0]}>
          <boxGeometry args={[0.23, 0.06, 0.21]} />
          <meshStandardMaterial color={cloakColor} roughness={0.6} />
        </mesh>
        {/* Hair sides */}
        <mesh position={[0.115, 0.92, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.2]} />
          <meshStandardMaterial color={cloakColor} roughness={0.6} />
        </mesh>
        <mesh position={[-0.115, 0.92, 0]}>
          <boxGeometry args={[0.03, 0.12, 0.2]} />
          <meshStandardMaterial color={cloakColor} roughness={0.6} />
        </mesh>

        {/* ===== ARMS with more detail ===== */}
        {/* Left arm */}
        <group ref={leftArmRef} position={[0.17, 0.65, 0]}>
          {/* Upper arm */}
          <mesh castShadow position={[0, -0.08, 0]}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
            <meshStandardMaterial color={agent.color} roughness={0.4} />
          </mesh>
          {/* Forearm */}
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.07, 0.14, 0.07]} />
            <meshStandardMaterial color="#f0c8a0" roughness={0.5} />
          </mesh>
          {/* Glove / hand */}
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.06]} />
            <meshStandardMaterial color="#6a5a3a" roughness={0.7} />
          </mesh>
        </group>

        {/* Right arm */}
        <group ref={rightArmRef} position={[-0.17, 0.65, 0]}>
          <mesh castShadow position={[0, -0.08, 0]}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
            <meshStandardMaterial color={agent.color} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.07, 0.14, 0.07]} />
            <meshStandardMaterial color="#f0c8a0" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.3, 0]}>
            <boxGeometry args={[0.06, 0.04, 0.06]} />
            <meshStandardMaterial color="#6a5a3a" roughness={0.7} />
          </mesh>
        </group>

        {/* ===== LEGS with boots ===== */}
        {/* Left leg */}
        <group ref={leftLegRef} position={[0.07, 0.35, 0]}>
          {/* Thigh */}
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#3a3a5a" roughness={0.5} />
          </mesh>
          {/* Boot */}
          <mesh castShadow position={[0, -0.24, 0.01]}>
            <boxGeometry args={[0.1, 0.12, 0.13]} />
            <meshStandardMaterial color="#4a3018" roughness={0.7} />
          </mesh>
          {/* Boot sole */}
          <mesh position={[0, -0.3, 0.015]}>
            <boxGeometry args={[0.11, 0.02, 0.14]} />
            <meshStandardMaterial color="#2a1a08" roughness={0.9} />
          </mesh>
          {/* Boot strap */}
          <mesh position={[0, -0.2, 0.06]}>
            <boxGeometry args={[0.1, 0.02, 0.015]} />
            <meshStandardMaterial color="#3a2510" roughness={0.6} />
          </mesh>
        </group>

        {/* Right leg */}
        <group ref={rightLegRef} position={[-0.07, 0.35, 0]}>
          <mesh castShadow position={[0, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#3a3a5a" roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0, -0.24, 0.01]}>
            <boxGeometry args={[0.1, 0.12, 0.13]} />
            <meshStandardMaterial color="#4a3018" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.3, 0.015]}>
            <boxGeometry args={[0.11, 0.02, 0.14]} />
            <meshStandardMaterial color="#2a1a08" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.2, 0.06]}>
            <boxGeometry args={[0.1, 0.02, 0.015]} />
            <meshStandardMaterial color="#3a2510" roughness={0.6} />
          </mesh>
        </group>

        {/* ===== Unique Agent Accessory ===== */}
        <AgentAccessory agentId={agent.id} color={agent.color} />
      </group>

      {/* Status bubble above head */}
      <Billboard position={[0, 1.25, 0]}>
        <Text fontSize={0.14} anchorX="center" anchorY="middle">{statusBubble}</Text>
      </Billboard>

      {/* Emoji on chest */}
      <Billboard position={[0, 0.55, 0.09]}>
        <Text fontSize={0.12} anchorX="center" anchorY="middle">{agent.emoji}</Text>
      </Billboard>

      {/* Name */}
      <Billboard position={[0, 1.45, 0]}>
        <Text fontSize={0.11} color={isSelected ? "#c9a84c" : "#e8dcc8"} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0d1117">
          {agent.name}
        </Text>
      </Billboard>
      <Billboard position={[0, 1.3, 0]}>
        <Text fontSize={0.09} color="#8b8680" anchorX="center" anchorY="middle">
          {agent.role}
        </Text>
      </Billboard>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.42, 32]} />
          <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={1.0} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Shadow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 8]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}
