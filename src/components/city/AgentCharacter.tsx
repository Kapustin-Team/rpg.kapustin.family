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
   Individual accessory components (scaled for ~0.35 unit character)
   ============================================= */
function Glasses({ round }: { round?: boolean }) {
  return (
    <group position={[0, 0.01, 0.038]}>
      <mesh>
        <boxGeometry args={[0.02, 0.002, 0.002]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
      {[-0.014, 0.014].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          {round ? <sphereGeometry args={[0.008, 8, 8]} /> : <boxGeometry args={[0.014, 0.008, 0.002]} />}
          <meshStandardMaterial color="#a0d0ff" metalness={0.8} roughness={0.1} transparent opacity={0.4} />
        </mesh>
      ))}
      {[-0.022, 0.022].map((x, i) => (
        <mesh key={i} position={[x, 0, -0.016]}>
          <boxGeometry args={[0.001, 0.001, 0.032]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Earrings() {
  return (
    <>
      {[-0.028, 0.028].map((x, i) => (
        <mesh key={i} position={[x, -0.008, 0]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </>
  )
}

function NoseRing() {
  return (
    <mesh position={[0.006, -0.004, 0.042]}>
      <torusGeometry args={[0.003, 0.001, 6, 8]} />
      <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
    </mesh>
  )
}

function Briefcase({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.03, 0.024, 0.01]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.014, 0]}>
        <torusGeometry args={[0.006, 0.001, 4, 8]} />
        <meshStandardMaterial color="#b0b0b0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function Laptop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0.2, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.03, 0.001, 0.024]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.001, -0.012]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.028, 0.02, 0.001]} />
        <meshStandardMaterial color="#1e293b" emissive="#334155" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function Headphones({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.016, 0.002, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
      {[-0.016, 0.016].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
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
        <boxGeometry args={[0.02, 0.014, 0.012]} />
        <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <cylinderGeometry args={[0.004, 0.005, 0.008, 8]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Phone({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.01, 0.02, 0.002]} />
      <meshStandardMaterial color="#1f2937" emissive="#334155" emissiveIntensity={0.3} />
    </mesh>
  )
}

function Books({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 0.006, 0.012].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.024, 0.005, 0.016]} />
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
        <torusGeometry args={[0.008, 0.002, 6, 12]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
      </mesh>
    </group>
  )
}

function WaterBottle({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.005, 0.005, 0.024, 6]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.5} roughness={0.3} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.014, 0]}>
        <cylinderGeometry args={[0.003, 0.005, 0.004, 6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

/* =============================================
   Hair styles (scaled for 0.04 radius head)
   ============================================= */
function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'bun':
      return (
        <group>
          <mesh position={[0, 0.024, -0.008]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.048, -0.004]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'short':
      return (
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[0.048, 0.024, 0.052]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      )
    case 'long':
      return (
        <group>
          <mesh position={[0, 0.016, -0.008]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.02, -0.02]}>
            <boxGeometry args={[0.04, 0.048, 0.016]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'longFlowing':
      return (
        <group>
          <mesh position={[0, 0.016, 0]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.02, -0.016]}>
            <coneGeometry args={[0.024, 0.06, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    case 'ponytail':
      return (
        <group>
          <mesh position={[0, 0.016, -0.008]}>
            <sphereGeometry args={[0.038, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.008, -0.032]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.008, 0.04, 6]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      )
    default:
      return null
  }
}

/* =============================================
   Humanoid Body — properly scaled for ~0.35 units tall
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
      if (torsoRef.current) {
        torsoRef.current.scale.y = 1 + Math.sin(t * 2) * 0.01
      }
      if (bodyRef.current) {
        bodyRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
      }
    } else if (animState === 'walking') {
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * 8) * 0.4
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.4
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 8 + Math.PI) * 0.3
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * 8) * 0.3
      if (headRef.current) headRef.current.position.y = 0.3 + Math.abs(Math.sin(t * 8)) * 0.005
    } else if (animState === 'working') {
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.5 + Math.sin(t * 6) * 0.08
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.5 + Math.sin(t * 6 + 1) * 0.08
      if (headRef.current) headRef.current.rotation.x = -0.15
    }
  })

  const accessories = style.accessories || []

  // Character layout (bottom to top, total ~0.35):
  // Feet bottom: y ≈ 0.0
  // Feet center: y ≈ 0.004
  // Lower legs: y ≈ 0.004 to 0.054 (0.05 tall)
  // Upper legs: y ≈ 0.054 to 0.109 (0.055 tall)
  // Hips/waist: y ≈ 0.109
  // Lower torso: y ≈ 0.129 (0.04 tall)
  // Upper torso: y ≈ 0.162 (0.065 tall)
  // Neck: y ≈ 0.202
  // Head center: y ≈ 0.3
  // Head top: y ≈ 0.34

  return (
    <group ref={bodyRef} scale={[1, 1, 1]}>
      {/* Head */}
      <group ref={headRef} position={[0, 0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.012, 0.008, 0.036]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.012, 0.008, 0.036]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.002, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.005, 0.008, 4]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, -0.012, 0.037]}>
          <boxGeometry args={[0.015, 0.002, 0.003]} />
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
      <mesh position={[0, 0.255, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.015, 6]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>

      {/* Upper torso */}
      <mesh ref={torsoRef} position={[0, 0.215, 0]}>
        <boxGeometry args={[0.06, 0.065, 0.025]} />
        <meshStandardMaterial color={style.topColor} roughness={0.7} />
      </mesh>

      {/* Lower torso */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.05, 0.04, 0.022]} />
        <meshStandardMaterial color={style.topColor} roughness={0.7} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.148, 0]}>
        <boxGeometry args={[0.052, 0.006, 0.024]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>

      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.038, 0.235, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.025, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.05, 6]} />
          <meshStandardMaterial color={style.topColor} roughness={0.7} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.072, 0]}>
          <cylinderGeometry args={[0.008, 0.01, 0.045, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.012, 0.015, 0.008]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {/* Finger bumps */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[-0.004 + i * 0.003, -0.109, 0]}>
            <boxGeometry args={[0.002, 0.004, 0.003]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
        ))}
        {/* Left arm accessories */}
        {accessories.includes('briefcase') && <Briefcase position={[0, -0.11, 0.008]} />}
        {accessories.includes('laptop') && <Laptop position={[0.008, -0.08, 0.012]} />}
        {accessories.includes('books') && <Books position={[0, -0.072, 0.016]} />}
        {accessories.includes('waterbottle') && <WaterBottle position={[0, -0.1, 0.008]} />}
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.038, 0.235, 0]}>
        <mesh position={[0, -0.025, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.05, 6]} />
          <meshStandardMaterial color={style.topColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.072, 0]}>
          <cylinderGeometry args={[0.008, 0.01, 0.045, 6]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.012, 0.015, 0.008]} />
          <meshStandardMaterial color={skinColor} roughness={0.7} />
        </mesh>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[-0.004 + i * 0.003, -0.109, 0]}>
            <boxGeometry args={[0.002, 0.004, 0.003]} />
            <meshStandardMaterial color={skinColor} roughness={0.7} />
          </mesh>
        ))}
        {/* Right arm accessories */}
        {accessories.includes('phone') && <Phone position={[0, -0.095, 0.008]} />}
        {accessories.includes('camera') && <Camera position={[0, -0.04, 0.016]} />}
        {accessories.includes('fitnesstracker') && <FitnessTracker position={[0, -0.08, 0]} />}
      </group>

      {/* Headphones around neck */}
      {accessories.includes('headphones') && <Headphones position={[0, 0.25, 0.008]} />}

      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.014, 0.145, 0]}>
        {/* Upper leg */}
        <mesh position={[0, -0.028, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.055, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.05, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.109, 0.005]}>
          <boxGeometry args={[0.015, 0.008, 0.025]} />
          <meshStandardMaterial color={style.shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rightLegRef} position={[0.014, 0.145, 0]}>
        <mesh position={[0, -0.028, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.055, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.05, 6]} />
          <meshStandardMaterial color={style.bottomColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.109, 0.005]}>
          <boxGeometry args={[0.015, 0.008, 0.025]} />
          <meshStandardMaterial color={style.shoeColor} roughness={0.6} />
        </mesh>
      </group>

      {/* Bag accessories */}
      {accessories.includes('bag') && (
        <mesh position={[0.04, 0.18, -0.012]}>
          <boxGeometry args={[0.016, 0.032, 0.008]} />
          <meshStandardMaterial color="#ec4899" roughness={0.6} />
        </mesh>
      )}
      {accessories.includes('messengerbag') && (
        <group>
          <mesh position={[-0.032, 0.12, -0.004]}>
            <boxGeometry args={[0.024, 0.032, 0.01]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.24, 0]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.072, 0.002, 0.006]} />
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

  useMemo(() => {
    if (agent.targetPosition) {
      targetRef.current = new THREE.Vector3(...agent.targetPosition)
    }
  }, [agent.targetPosition])

  const animState = agent.status === 'moving' ? 'walking' :
                    agent.status === 'working' ? 'working' : 'idle'

  useFrame((state, delta) => {
    if (!groupRef.current) return

    if (targetRef.current && agent.status === 'moving') {
      const dir = targetRef.current.clone().sub(posRef.current)
      const dist = dir.length()
      if (dist > 0.05) {
        dir.normalize()
        const speed = 2
        posRef.current.add(dir.multiplyScalar(Math.min(speed * delta, dist)))
        groupRef.current.rotation.y = Math.atan2(dir.x, dir.z)
      } else {
        posRef.current.copy(targetRef.current)
        targetRef.current = null
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
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && !isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.23, 32]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Name label */}
      <Billboard position={[0, 0.55, 0]}>
        <Text fontSize={0.12} color={isSelected ? '#0ea5e9' : '#e2e8f0'} anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#0f172a">
          {agent.emoji} {agent.name.split(' ')[0]}
        </Text>
      </Billboard>

      {/* Role */}
      <Billboard position={[0, 0.46, 0]}>
        <Text fontSize={0.07} color="#94a3b8" anchorX="center" anchorY="middle">
          {agent.role}
        </Text>
      </Billboard>

      {/* Status indicator */}
      <Billboard position={[0, 0.4, 0]}>
        <Text
          fontSize={0.06}
          color={agent.status === 'idle' ? '#22c55e' : agent.status === 'working' ? '#eab308' : '#0ea5e9'}
          anchorX="center"
          anchorY="middle"
        >
          {agent.status === 'idle' ? '● Idle' : agent.status === 'working' ? '◐ Working' : '→ Moving'}
        </Text>
      </Billboard>

      {/* Movement path line */}
      {agent.status === 'moving' && agent.targetPosition && (
        <group>
          <mesh position={[agent.targetPosition[0] - agent.position[0], 0.05, agent.targetPosition[2] - agent.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.2, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}
