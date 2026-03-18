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
  const [wanderTarget, setWanderTarget] = useState<[number, number]>([agent.position[0], agent.position[2]])
  const selectedAgentId = useGameStore((s) => s.selectedAgentId)
  const setSelectedAgent = useGameStore((s) => s.setSelectedAgent)
  const isSelected = selectedAgentId === agent.id

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
      groupRef.current.position.y = 0.05 + Math.sin(t * 3) * 0.05
    } else if (agent.status === "idle") {
      const dx = wanderTarget[0] - groupRef.current.position.x
      const dz = wanderTarget[1] - groupRef.current.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist > 0.15) {
        groupRef.current.position.x += (dx / dist) * delta * 0.8
        groupRef.current.position.z += (dz / dist) * delta * 0.8
        groupRef.current.rotation.y = Math.atan2(dx, dz)
      }
    }
  })

  return (
    <group
      ref={groupRef}
      position={agent.position}
      onClick={(e) => { e.stopPropagation(); setSelectedAgent(agent.id) }}
    >
      {/* Body */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
        <meshStandardMaterial
          color={agent.color}
          roughness={0.4}
          emissive={isSelected ? agent.color : "#000000"}
          emissiveIntensity={isSelected ? 0.4 : 0}
        />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={agent.color} roughness={0.3} />
      </mesh>
      {/* Emoji */}
      <Billboard position={[0, 0.45, 0.21]}>
        <Text fontSize={0.18} anchorX="center" anchorY="middle">{agent.emoji}</Text>
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
