'use client'
import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import type { Agent } from '@/data/agents'

/* =============================================
   Agent-specific clothing configs
   ============================================= */
const AGENT_STYLE: Record<string, {
  bodyColor: string
  topColor: string
  bottomColor: string
  shoeColor: string
  hairColor: string
  hairStyle: 'bun' | 'short' | 'long' | 'longFlowing' | 'ponytail'
  accessories: string[]
  skinColor?: string
}> = {
  milena: {
    bodyColor: '#1e3a5f', topColor: '#1e3a5f', bottomColor: '#1e3a5f',
    shoeColor: '#111', hairColor: '#2c1810', hairStyle: 'bun',
    accessories: ['glasses', 'briefcase', 'earrings'],
  },
  aleksandra: {
    bodyColor: '#6b21a8', topColor: '#4c1d95', bottomColor: '#1f2937',
    shoeColor: '#1a1a1a', hairColor: '#e5e5e5', hairStyle: 'short',
    accessories: ['nosering', 'laptop', 'headphones'],
  },
  kristina: {
    bodyColor: '#db2777', topColor: '#ec4899', bottomColor: '#ec4899',
    shoeColor: '#f9a8d4', hairColor: '#92400e', hairStyle: 'longFlowing',
    accessories: ['camera', 'phone', 'bag'],
  },
  danijela: {
    bodyColor: '#15803d', topColor: '#166534', bottomColor: '#78350f',
    shoeColor: '#451a03', hairColor: '#44403c', hairStyle: 'long',
    accessories: ['glasses', 'books', 'messengerbag'],
  },
  jovana: {
    bodyColor: '#7c3aed', topColor: '#6d28d9', bottomColor: '#4c1d95',
    shoeColor: '#ddd', hairColor: '#1c1917', hairStyle: 'ponytail',
    accessories: ['fitnesstracker', 'waterbottle'],
    skinColor: '#d4a76a',
  },
}

/* =============================================
   Individual accessory components
   ============================================= */
function Glasses({ round }: { round?: boolean }) {
  return (
    <group position={[0, 0.02, 0.12]}>
      {/* Bridge */}
      <mesh>
        <boxGeometry args={[0.04, 0.005, 0.005]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lenses */}
      {[-0.035, 0.035].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          {round ? <sphereGeometry args={[0.02, 8, 8]} /> : <boxGeometry args={[0.035, 0.02, 0.005]} />}
          <meshStandardMaterial color="#a0d0ff" metalness={0.8} roughness={0.1} transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Arms */}
      {[-0.055, 0.055].map((x, i) => (
        <mesh key={i} position={[x, 0, -0.04]}>
          <boxGeometry args={[0.003, 0.003, 0.08]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Earrings() {
  return (
    <>
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, -0.02, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </>
  )
}

function NoseRing() {
  return (
    <mesh position={[0.015, -0.01, 0.13]}>
      <torusGeometry args={[0.008, 0.002, 6, 8]} />
      <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
    </mesh>
  )
}

function Briefcase({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.08, 0.06, 0.025]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <torusGeometry args={[0.015, 0.003, 4, 8]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Laptop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0.2, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.08, 0.002, 0.06]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.002, -0.03]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.07, 0.05, 0.002]} />
        <meshStandardMaterial color="#1e293b" emissive="#334155" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function Headphones({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.04, 0.006, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
      {[-0.04, 0.04].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Camera({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.05, 0.035, 0.03]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <cylinderGeometry args={[0.01, 0.012, 0.02, 8]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Phone({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.025, 0.05, 0.005]} />
      <meshStandardMaterial color="#1f2937" emissive="#334155" emissiveIntensity={0.3} />
    </mesh>
  )
}

function Books({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 0.015, 0.03].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.06, 0.012, 0.04]} />
          <meshStandardMaterial color={['#7c3aed', '#ef4444', '#0ea5e9'][i]} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function FitnessTracker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.02, 0.004, 6, 12]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

function WaterBottle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.5} roughness={0.3} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.008, 0.012, 0.01, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

/* =============================================
   Hair styles
   ============================================= */
function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'bun':
      return (
        <group>
          <mesh position={[0, 0.06, -0.02]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.12, -0.01]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'short':
      return (
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.13]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      )
    case 'long':
      return (
        <group>
          <mesh position={[0, 0.04, -0.02]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.05, -0.05]}>
            <boxGeometry args={[0.1, 0.12, 0.04]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'longFlowing':
      return (
        <group>
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.05, -0.04]}>
            <coneGeometry args={[0.06, 0.15, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'ponytail':
      return (
        <group>
          <mesh position={[0, 0.04, -0.02]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, -0.08]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.1, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

/* =============================================
   Humanoid Body
   ============================================= */
function HumanoidBody({ agentId, animState }: { agentId: string; animState: 'idle' | 'walking' | 'working' }) {
  const style = AGENT_STYLE[agentId] || AGENT_STYLE.milena
  const bodyRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Mesh>(null)
  const headRef = useRef<THREE.Group>(null)
  const skinColor = style.skinColor || '#deb896'

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (animState === 'idle') {
      // Breathing
      if (torsoRef.current) {
        torsoRef.current.scale.y = 1 + Math.sin(t * 2) * 0.01
      }
      // Weight shifting
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
      }
    } else if (animState === 'walking') {
      // Leg alternation
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 8) * 0.4
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.4
      // Arm swing
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.3
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 8) * 0.3
      // Head bob
      if (headRef.current) headRef.current.position.y = 0.52 + Math.abs(Math.sin(t * 8)) * 0.01
    } else if (animState === 'working') {
      // Typing animation — hands moving
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5 + Math.sin(t * 6) * 0.08
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5 + Math.sin(t * 6 + 1) * 0.08
      // Head tilted down
      if (headRef.current) headRef.current.rotation.x = -0.15
    }
  })

  const accessories = style.accessories || []

  return (
    <group ref={bodyRef} scale={[4, 4, 4]}>
      {/* Head */}
      <group ref={headRef} position={[0, 0.52, 0]}>
        <mesh>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.02, 0.015, 0.055]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.02, 0.015, 0.055]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.005, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.006, 0.015, 4]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, -0.02, 0.055]}>
          <boxGeometry args={[0.02, 0.003, 0.003]} />
          <meshStandardMaterial color="#b47070" />
        </mesh>
        {/* Hair */}
        <Hair style={style.hairStyle} color={style.hairColor} />
        {/* Face accessories */}
        {accessories.includes('glasses') && <Glasses round={agentId === 'danijela'} />}
        {accessories.includes('earrings') && <Earrings />}
        {accessories.includes('nosering') && <NoseRing />}
      </group>

      {/* Neck */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.04, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Torso */}
      <mesh ref={torsoRef} position={[0, 0.35, 0]}>
        <boxGeometry args={[0.14, 0.2, 0.08]} />
        <meshStandardMaterial color={style.topColor} roughness={0.7} />
      </mesh>

      {/* Shoulders (wider) */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.08]} />
        <meshStandardMaterial color={style.topColor} roughness={0.7} />
      </mesh>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.09, 0.4, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.018, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.topColor} roughness={0.7} />
        </mesh>
        {/* Elbow joint */}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.1, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.02, 0.025, 0.015]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Left arm accessories */}
        {accessories.includes('briefcase') && <Briefcase position={[0, -0.26, 0.02]} />}
        {accessories.includes('laptop') && <Laptop position={[0.02, -0.2, 0.03]} />}
        {accessories.includes('books') && <Books position={[0, -0.18, 0.04]} />}
        {accessories.includes('waterbottle') && <WaterBottle position={[0, -0.24, 0.02]} />}
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.09, 0.4, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.018, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.topColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.015, 0.018, 0.1, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <boxGeometry args={[0.02, 0.025, 0.015]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Right arm accessories */}
        {accessories.includes('phone') && <Phone position={[0, -0.23, 0.02]} />}
        {accessories.includes('camera') && <Camera position={[0, -0.1, 0.04]} />}
        {accessories.includes('fitnesstracker') && <FitnessTracker position={[0, -0.2, 0]} />}
      </group>

      {/* Headphones around neck */}
      {accessories.includes('headphones') && <Headphones position={[0, 0.44, 0.02]} />}

      {/* Waist / belt area */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.07]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>

      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.035, 0.23, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        {/* Knee joint */}
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        {/* Shin */}
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.018, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.26, 0.01]}>
          <boxGeometry args={[0.025, 0.015, 0.04]} />
          <meshStandardMaterial color={style.shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLegRef} position={[0.035, 0.23, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.025, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.018, 0.02, 0.12, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.26, 0.01]}>
          <boxGeometry args={[0.025, 0.015, 0.04]} />
          <meshStandardMaterial color={style.shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Bag accessories */}
      {accessories.includes('bag') && (
        <mesh position={[0.1, 0.3, -0.03]}>
          <boxGeometry args={[0.04, 0.08, 0.02]} />
          <meshStandardMaterial color="#ec4899" roughness={0.6} />
        </mesh>
      )}
      {accessories.includes('messengerbag') && (
        <group>
          <mesh position={[-0.08, 0.2, -0.01]}>
            <boxGeometry args={[0.06, 0.08, 0.025]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.18, 0.005, 0.015]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/* =============================================
   Main Agent Character Component
   ============================================= */
export function AgentCharacter({ agent }: { agent: Agent }) {
  const groupRef = useRef<THREE.Group>(null)
  const { selectedAgentId, setSelectedAgent, moveAgentTo, moveAgentToBuilding, editMode, buildings } = useGameStore()
  const isSelected = selectedAgentId === agent.id
  const [hovered, setHovered] = useState(false)
  const posRef = useRef(new THREE.Vector3(...agent.position))
  const targetRef = useRef<THREE.Vector3 | null>(agent.targetPosition ? new THREE.Vector3(...agent.targetPosition) : null)

  // Update target when agent target changes
  useMemo(() => {
    if (agent.targetPosition) {
      targetRef.current = new THREE.Vector3(...agent.targetPosition)
    }
  }, [agent.targetPosition])

  // Determine animation state
  const animState = agent.status === 'moving' ? 'walking' :
                    agent.status === 'working' ? 'working' : 'idle'

  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Movement towards target
    if (targetRef.current && agent.status === 'moving') {
      const dir = targetRef.current.clone().sub(posRef.current)
      const dist = dir.length()
      if (dist > 0.05) {
        dir.normalize()
        const speed = 2
        posRef.current.add(dir.multiplyScalar(Math.min(speed * delta, dist)))
        // Face direction of movement
        groupRef.current.rotation.y = Math.atan2(dir.x, dir.z)
      } else {
        // Arrived
        posRef.current.copy(targetRef.current)
        targetRef.current = null
        // Update store — set status to idle or working
        const store = useGameStore.getState()
        const updatedAgents = store.agents.map(a =>
          a.id === agent.id ? { ...a, position: [posRef.current.x, 0, posRef.current.z] as [number, number, number], status: (a.currentTaskId ? 'working' : 'idle') as Agent['status'], targetPosition: undefined } : a
        )
        useGameStore.setState({ agents: updatedAgents })
      }
    } else {
      posRef.current.set(...agent.position)
    }

    groupRef.current.position.copy(posRef.current)
  })

  // Right-click handler is on the ground plane in CityScene

  return (
    <group
      ref={groupRef}
      position={agent.position}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedAgent(agent.id)
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Humanoid body */}
      <HumanoidBody agentId={agent.id} animState={animState} />

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && !isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Name label */}
      <Billboard position={[0, 2.8, 0]}>
        <Text fontSize={0.2} color={isSelected ? '#0ea5e9' : '#e2e8f0'} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#0f172a">
          {agent.emoji} {agent.name.split(' ')[0]}
        </Text>
      </Billboard>

      {/* Role */}
      <Billboard position={[0, 2.5, 0]}>
        <Text fontSize={0.12} color="#94a3b8" anchorX="center" anchorY="middle">
          {agent.role}
        </Text>
      </Billboard>

      {/* Status indicator */}
      <Billboard position={[0, 2.25, 0]}>
        <Text
          fontSize={0.1}
          color={agent.status === 'idle' ? '#22c55e' : agent.status === 'working' ? '#eab308' : '#0ea5e9'}
          anchorX="center"
          anchorY="middle"
        >
          {agent.status === 'idle' ? '● Idle' : agent.status === 'working' ? '◐ Working' : '→ Moving'}
        </Text>
      </Billboard>

      {/* Movement path line (shown when moving) */}
      {agent.status === 'moving' && agent.targetPosition && (
        <group>
          {/* Destination marker */}
          <mesh position={[agent.targetPosition[0] - agent.position[0], 0.05, agent.targetPosition[2] - agent.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.4, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}
