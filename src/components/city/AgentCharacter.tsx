"use client"
import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text, Billboard } from "@react-three/drei"
import { useGameStore } from "@/store/gameStore"
import type { Agent } from "@/data/agents"
import * as THREE from "three"

interface Props { agent: Agent }

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
      // Working animation - lean forward, rapid arm pump
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
        // Walking
        groupRef.current.position.x += (dx / dist) * delta * 0.8
        groupRef.current.position.z += (dz / dist) * delta * 0.8
        groupRef.current.rotation.y = Math.atan2(dx, dz)
        setIsMoving(true)

        const walkSpeed = 4
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.6
        if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * walkSpeed) * 0.6
        if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * walkSpeed) * 0.5
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * walkSpeed) * 0.5
        if (bodyGroupRef.current) {
          bodyGroupRef.current.position.y = Math.abs(Math.sin(t * walkSpeed * 2)) * 0.04
          bodyGroupRef.current.rotation.x = 0
        }
      } else {
        // Idle animation - breathing, slight sway
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
      {/* Body group - handles animations */}
      <group ref={bodyGroupRef}>
        {/* Torso */}
        <mesh ref={torsoRef} castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.22, 0.35, 0.14]} />
          <meshStandardMaterial
            color={agent.color}
            roughness={0.4}
            emissive={isSelected ? agent.color : "#000000"}
            emissiveIntensity={isSelected ? 0.4 : 0}
          />
        </mesh>

        {/* Cloak (behind torso) */}
        <mesh castShadow position={[0, 0.55, -0.09]}>
          <boxGeometry args={[0.26, 0.38, 0.04]} />
          <meshStandardMaterial color={cloakColor} roughness={0.5} />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} castShadow position={[0, 0.87, 0]}>
          <boxGeometry args={[0.22, 0.22, 0.2]} />
          <meshStandardMaterial color="#f0c8a0" roughness={0.5} />
        </mesh>

        {/* Hair */}
        <mesh castShadow position={[0, 1.0, 0]}>
          <boxGeometry args={[0.23, 0.06, 0.21]} />
          <meshStandardMaterial color={cloakColor} roughness={0.6} />
        </mesh>

        {/* Left arm - pivoted at shoulder */}
        <group ref={leftArmRef} position={[0.17, 0.65, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <meshStandardMaterial color={agent.color} roughness={0.4} />
          </mesh>
        </group>

        {/* Right arm - pivoted at shoulder */}
        <group ref={rightArmRef} position={[-0.17, 0.65, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <meshStandardMaterial color={agent.color} roughness={0.4} />
          </mesh>
        </group>

        {/* Left leg - pivoted at hip */}
        <group ref={leftLegRef} position={[0.07, 0.35, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <boxGeometry args={[0.1, 0.32, 0.1]} />
            <meshStandardMaterial color="#3a3a5a" roughness={0.5} />
          </mesh>
        </group>

        {/* Right leg - pivoted at hip */}
        <group ref={rightLegRef} position={[-0.07, 0.35, 0]}>
          <mesh castShadow position={[0, -0.16, 0]}>
            <boxGeometry args={[0.1, 0.32, 0.1]} />
            <meshStandardMaterial color="#3a3a5a" roughness={0.5} />
          </mesh>
        </group>
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
    </group>
  )
}
