'use client'
import { useRef, useState, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import { useGameStore, type Building as BuildingType } from '@/store/gameStore'
import { BUILDING_TEMPLATES } from '@/data/buildings'
import * as THREE from 'three'

/* ================================================
   Shared animated helpers
   ================================================ */
function BlinkingLight({ position, color = '#ff0000', speed = 2 }: { position: [number, number, number]; color?: string; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = Math.sin(s.clock.elapsedTime * speed) > 0 ? 2 : 0.2
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  )
}

function SpinningFan({ position, speed = 3 }: { position: [number, number, number]; speed?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed })
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0.15, 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.08]} />
          <meshStandardMaterial color="#b0b0b0" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function RotatingRing({ position, radius = 1, speed = 0.5, color = '#0ea5e9' }: { position: [number, number, number]; radius?: number; speed?: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * speed })
  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[radius, 0.03, 8, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} metalness={0.9} roughness={0.1} transparent opacity={0.7} />
    </mesh>
  )
}

function LEDStrip({ points, color = '#0ea5e9' }: { points: [number, number, number][]; color?: string }) {
  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      ))}
    </>
  )
}

function GlowingPanel({ position, size, color = '#0ea5e9', opacity = 0.4, rotation }: {
  position: [number, number, number]; size: [number, number, number]; color?: string; opacity?: number; rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={opacity} metalness={0.9} roughness={0.1} />
    </mesh>
  )
}

/* ================================================
   HQ — Glass Skyscraper
   ================================================ */
function HQModel() {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => {
    // Holographic panel animation
    if (ref.current) {
      const holo = ref.current.getObjectByName('holo')
      if (holo) holo.rotation.y = s.clock.elapsedTime * 0.3
    }
  })
  return (
    <group ref={ref}>
      {/* Main tower — glass */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[1.2, 3, 1.2]} />
        <meshStandardMaterial color="#b8d4e8" metalness={0.9} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      {/* Glass panels reflection strips */}
      {[0, 0.5, 1, 1.5, 2, 2.5].map(y => (
        <mesh key={y} position={[0, y + 0.2, 0.61]}>
          <boxGeometry args={[1.18, 0.02, 0.01]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
        </mesh>
      ))}
      {/* LED edge strips left */}
      <LEDStrip color="#0ea5e9" points={Array.from({ length: 12 }, (_, i) => [0.61, i * 0.25, 0] as [number, number, number])} />
      {/* LED edge strips right */}
      <LEDStrip color="#0ea5e9" points={Array.from({ length: 12 }, (_, i) => [-0.61, i * 0.25, 0] as [number, number, number])} />
      {/* Ground floor atrium */}
      <mesh position={[0, 0.2, 0.3]}>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshStandardMaterial color="#e0f0ff" metalness={0.9} roughness={0.05} transparent opacity={0.6} />
      </mesh>
      {/* Revolving door */}
      <mesh position={[0, 0.15, 0.62]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
        <meshStandardMaterial color="#aad4ee" metalness={0.8} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      {/* Helipad on roof */}
      <mesh position={[0, 3.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#404040" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.35, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <BlinkingLight position={[0.35, 3.05, 0.35]} color="#ff0000" speed={3} />
      <BlinkingLight position={[-0.35, 3.05, -0.35]} color="#ff0000" speed={3} />
      {/* Solar panels on side */}
      <mesh position={[0, 2.5, -0.62]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1, 0.6, 0.03]} />
        <meshStandardMaterial color="#1a1a3a" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Company logo "K" */}
      <Billboard position={[0, 2, 0.62]}>
        <Text fontSize={0.3} color="#0ea5e9" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000">
          K
        </Text>
      </Billboard>
      {/* Holographic display */}
      <group name="holo" position={[0, 0.8, 0.7]}>
        <GlowingPanel position={[0, 0, 0]} size={[0.4, 0.3, 0.01]} color="#0ea5e9" opacity={0.3} />
        <GlowingPanel position={[0.15, 0.05, 0.05]} size={[0.2, 0.15, 0.01]} color="#22d3ee" opacity={0.2} />
      </group>
      {/* Security cameras */}
      {[[0.6, 2.8, 0.6], [-0.6, 2.8, -0.6]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.06, 0.04, 0.08]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Antenna array */}
      <mesh position={[0, 3.3, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.15, 3.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4, 4]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>
      <BlinkingLight position={[0, 3.62, 0]} color="#ff0000" speed={1.5} />
    </group>
  )
}

/* ================================================
   Farm — Vertical Farm / Greenhouse
   ================================================ */
function FarmModel() {
  const droneRef = useRef<THREE.Group>(null)
  const turbineRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (droneRef.current) {
      droneRef.current.position.x = Math.sin(t * 0.8) * 1.2
      droneRef.current.position.z = Math.cos(t * 0.8) * 1.2
      droneRef.current.position.y = 2.5 + Math.sin(t * 2) * 0.1
    }
    if (turbineRef.current) {
      const blade = turbineRef.current.getObjectByName('blade')
      if (blade) blade.rotation.z = t * 4
    }
  })
  return (
    <group>
      {/* Main greenhouse — glass with green tint */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[1.8, 1.6, 1.2]} />
        <meshStandardMaterial color="#a8e6a8" metalness={0.7} roughness={0.1} transparent opacity={0.55} />
      </mesh>
      {/* Hydroponic racks inside — visible green rows */}
      {[-0.3, 0, 0.3].map((z, i) => (
        <group key={i}>
          {[0.3, 0.6, 0.9, 1.2].map((y, j) => (
            <mesh key={j} position={[0, y, z]}>
              <boxGeometry args={[1.5, 0.05, 0.2]} />
              <meshStandardMaterial color="#2d8a2d" roughness={0.7} />
            </mesh>
          ))}
          {/* UV lights — purple glow */}
          {[0.45, 0.75, 1.05].map((y, j) => (
            <mesh key={`uv-${j}`} position={[0, y, z]}>
              <boxGeometry args={[1.4, 0.02, 0.02]} />
              <meshStandardMaterial color="#9333ea" emissive="#9333ea" emissiveIntensity={1.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Solar roof panels */}
      <mesh position={[0, 1.62, 0]}>
        <boxGeometry args={[1.82, 0.04, 1.22]} />
        <meshStandardMaterial color="#1a1a4a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Water recycling pipes */}
      <mesh position={[-0.95, 0.4, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[-0.95, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Loading bay */}
      <mesh position={[0.95, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.5]} />
        <meshStandardMaterial color="#666" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Electric truck */}
      <mesh position={[1.3, 0.12, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.25]} />
        <meshStandardMaterial color="#fff" roughness={0.5} />
      </mesh>
      <mesh position={[1.15, 0.12, 0]}>
        <boxGeometry args={[0.15, 0.18, 0.23]} />
        <meshStandardMaterial color="#ddd" metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Drone */}
      <group ref={droneRef} position={[0, 2.5, 0]}>
        <mesh>
          <boxGeometry args={[0.12, 0.04, 0.12]} />
          <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
        </mesh>
        {[[-0.1, 0, -0.1], [0.1, 0, -0.1], [-0.1, 0, 0.1], [0.1, 0, 0.1]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.04, 0.04, 0.005, 6]} />
            <meshStandardMaterial color="#888" transparent opacity={0.5} />
          </mesh>
        ))}
        <BlinkingLight position={[0, -0.03, 0]} color="#22c55e" speed={5} />
      </group>
      {/* Wind turbine */}
      <group ref={turbineRef} position={[1.5, 0, -0.8]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 2, 6]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.6} />
        </mesh>
        <group name="blade" position={[0, 2, 0.05]}>
          {[0, 1, 2].map(i => (
            <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <boxGeometry args={[0.06, 0.6, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>
      {/* Green living walls on exterior */}
      <mesh position={[0, 0.8, 0.62]}>
        <boxGeometry args={[1.78, 1.55, 0.04]} />
        <meshStandardMaterial color="#2d6a2d" roughness={0.9} />
      </mesh>
    </group>
  )
}

/* ================================================
   Library — Digital Knowledge Hub
   ================================================ */
function LibraryModel() {
  const holoRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (holoRef.current) {
      holoRef.current.children.forEach((child, i) => {
        child.position.y = 2.2 + Math.sin(s.clock.elapsedTime * 0.5 + i * 1.2) * 0.15
        child.rotation.y = s.clock.elapsedTime * (0.3 + i * 0.1)
      })
    }
  })
  return (
    <group>
      {/* Main curved body — approximated with boxes */}
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.4]} />
        <meshStandardMaterial color="#dde6f0" metalness={0.6} roughness={0.15} transparent opacity={0.7} />
      </mesh>
      {/* Curved accent (wider at bottom) */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2, 0.6, 1.6]} />
        <meshStandardMaterial color="#c0d0e0" metalness={0.5} roughness={0.2} transparent opacity={0.5} />
      </mesh>
      {/* Floor-to-ceiling windows — front */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0.71]}>
          <boxGeometry args={[0.3, 1.3, 0.02]} />
          <meshStandardMaterial color="#a0d0ff" metalness={0.9} roughness={0.05} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* E-ink facade panels — side */}
      {[0.3, 0.7, 1.1].map((y, i) => (
        <mesh key={i} position={[0.92, y, 0]}>
          <boxGeometry args={[0.02, 0.25, 0.8]} />
          <meshStandardMaterial color="#1a1a2e" emissive="#334155" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Floating holographic books/screens */}
      <group ref={holoRef}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[Math.sin(i * 1.5) * 0.5, 2.2, Math.cos(i * 1.5) * 0.5]}>
            <boxGeometry args={[0.15, 0.2, 0.02]} />
            <meshStandardMaterial
              color={['#0ea5e9', '#8b5cf6', '#22d3ee', '#a78bfa'][i]}
              emissive={['#0ea5e9', '#8b5cf6', '#22d3ee', '#a78bfa'][i]}
              emissiveIntensity={1.2}
              transparent opacity={0.6}
            />
          </mesh>
        ))}
      </group>
      {/* Reading terrace */}
      <mesh position={[0.5, 1.42, 0.5]}>
        <boxGeometry args={[0.8, 0.03, 0.4]} />
        <meshStandardMaterial color="#8b7355" roughness={0.8} />
      </mesh>
      {/* Tiny furniture on terrace */}
      <mesh position={[0.4, 1.48, 0.5]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 1.48, 0.5]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#654321" roughness={0.8} />
      </mesh>
      {/* Satellite dish */}
      <mesh position={[0.6, 1.55, -0.4]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0, 0.15, 0.08, 8]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Coffee shop warm light */}
      <mesh position={[-0.6, 0.2, 0.72]}>
        <boxGeometry args={[0.4, 0.35, 0.02]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} transparent opacity={0.5} />
      </mesh>
      {/* Fiber optic cables to ground */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, -0.2, 0.7]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 4]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
        </mesh>
      ))}
      {/* Digital signage */}
      <mesh position={[0, 1.2, 0.72]}>
        <boxGeometry args={[0.6, 0.2, 0.02]} />
        <meshStandardMaterial color="#111827" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/* ================================================
   Lab — AI Research Center (Cylindrical tower)
   ================================================ */
function LabModel() {
  const radarRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (radarRef.current) radarRef.current.rotation.y = s.clock.elapsedTime * 0.8
  })
  return (
    <group>
      {/* Cylindrical main tower */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 2.4, 16]} />
        <meshStandardMaterial color="#e0eef8" metalness={0.7} roughness={0.15} transparent opacity={0.75} />
      </mesh>
      {/* Rotating rings */}
      <RotatingRing position={[0, 0.8, 0]} radius={0.85} speed={0.5} color="#06b6d4" />
      <RotatingRing position={[0, 1.4, 0]} radius={0.9} speed={-0.3} color="#0ea5e9" />
      <RotatingRing position={[0, 2.0, 0]} radius={0.85} speed={0.7} color="#22d3ee" />
      {/* Quantum computing core — glowing blue sphere */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} transparent opacity={0.6} />
      </mesh>
      {/* Robotic arms visible through windows */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={i} position={[Math.cos(angle) * 0.55, 0.6, Math.sin(angle) * 0.55]} rotation={[0, -angle, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.25, 0.04]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Chemical storage tanks */}
      {[[-0.9, 0.3, 0.3], [-0.9, 0.3, -0.3]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 8]} />
          <meshStandardMaterial color="#a0a0a0" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Clean room airlock entrance */}
      <mesh position={[0, 0.25, 0.82]}>
        <boxGeometry args={[0.3, 0.5, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.18, 0.25, 0.82]}>
        <boxGeometry args={[0.3, 0.5, 0.05]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Radar dish on top */}
      <group ref={radarRef} position={[0, 2.5, 0]}>
        <mesh rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0, 0.25, 0.1, 8]} />
          <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.3, 4]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      {/* Warning lights */}
      <BlinkingLight position={[0.7, 0.5, 0]} color="#eab308" speed={2} />
      <BlinkingLight position={[-0.7, 0.5, 0]} color="#eab308" speed={2} />
      {/* Laser test beams */}
      <mesh position={[0, 1.8, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.005, 0.005, 2, 4]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
      </mesh>
      {/* Exhaust vents */}
      {[0.3, -0.3].map((x, i) => (
        <mesh key={i} position={[x, 2.45, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 6]} />
          <meshStandardMaterial color="#666" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/* ================================================
   Server — Data Center
   ================================================ */
function ServerModel() {
  const serverLightsRef = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (serverLightsRef.current) {
      serverLightsRef.current.children.forEach((child, i) => {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial
        const phase = s.clock.elapsedTime * 3 + i * 0.7
        const hue = (phase % 6.28) / 6.28
        const r = Math.sin(hue * 6.28) * 0.5 + 0.5
        const g = Math.sin(hue * 6.28 + 2.09) * 0.5 + 0.5
        const b = Math.sin(hue * 6.28 + 4.19) * 0.5 + 0.5
        mat.emissive.setRGB(r, g, b)
        mat.emissiveIntensity = 1.5 + Math.sin(phase) * 0.5
      })
    }
  })
  return (
    <group>
      {/* Main bunker building */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.2, 1, 1.2]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Cooling units on roof */}
      {[-0.6, 0, 0.6].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 1.15, 0]}>
            <boxGeometry args={[0.35, 0.3, 0.35]} />
            <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.6} />
          </mesh>
          <SpinningFan position={[x, 1.35, 0]} speed={3 + i} />
        </group>
      ))}
      {/* Blinking server lights through windows */}
      <group ref={serverLightsRef}>
        {Array.from({ length: 16 }).map((_, i) => (
          <mesh key={i} position={[-0.9 + (i % 8) * 0.25, 0.25 + Math.floor(i / 8) * 0.3, 0.61]}>
            <boxGeometry args={[0.04, 0.02, 0.01]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} />
          </mesh>
        ))}
      </group>
      {/* Small windows */}
      {[-0.7, -0.2, 0.3, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0.61]}>
          <boxGeometry args={[0.15, 0.1, 0.01]} />
          <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.3} />
        </mesh>
      ))}
      {/* Cable tunnels / raised walkways */}
      <mesh position={[0, 1.05, 0.4]}>
        <boxGeometry args={[2.2, 0.06, 0.15]} />
        <meshStandardMaterial color="#4b5563" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Backup generators */}
      <mesh position={[1.3, 0.2, -0.3]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color="#555" metalness={0.4} roughness={0.7} />
      </mesh>
      <mesh position={[1.3, 0.5, -0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 4]} />
        <meshStandardMaterial color="#666" />
      </mesh>
      {/* Security fence perimeter */}
      {[-1.3, -0.65, 0, 0.65, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -0.75]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 4]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Fence wire */}
      <mesh position={[0, 0.4, -0.75]}>
        <boxGeometry args={[2.6, 0.01, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.55, -0.75]}>
        <boxGeometry args={[2.6, 0.01, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Fiber optic trunk — glowing cables */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0.7]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} />
        </mesh>
      ))}
      {/* LED Status display */}
      <Billboard position={[0, 0.85, 0.62]}>
        <Text fontSize={0.08} color="#22c55e" anchorX="center" anchorY="middle">
          99.99% UPTIME
        </Text>
      </Billboard>
      {/* UPS indicator */}
      <mesh position={[-1, 0.2, 0.55]}>
        <boxGeometry args={[0.2, 0.15, 0.08]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <BlinkingLight position={[-1, 0.32, 0.6]} color="#22c55e" speed={1} />
    </group>
  )
}

/* ================================================
   Barracks — Agent Training Academy
   ================================================ */
function BarracksModel() {
  const flagRef = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(s.clock.elapsedTime * 2) * 0.15
    }
  })
  return (
    <group>
      {/* Main complex */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 1, 1.5]} />
        <meshStandardMaterial color="#44403c" metalness={0.2} roughness={0.85} />
      </mesh>
      {/* VR training pods */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <group key={i} position={[x, 0.3, 0.5]}>
          <mesh>
            <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
            <meshStandardMaterial color="#b0d0e8" metalness={0.7} roughness={0.1} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ))}
      {/* Obstacle course in yard */}
      {[-0.7, -0.3, 0.1, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.08, -1]}>
          <boxGeometry args={[0.15, 0.15 + i * 0.1, 0.15]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      ))}
      {/* Simulation room — holographic displays */}
      <GlowingPanel position={[0.7, 0.7, 0]} size={[0.02, 0.4, 0.6]} color="#8b5cf6" opacity={0.3} />
      {/* Gym area silhouettes */}
      <mesh position={[-0.7, 0.2, -0.3]}>
        <boxGeometry args={[0.15, 0.3, 0.1]} />
        <meshStandardMaterial color="#555" roughness={0.8} />
      </mesh>
      {/* Briefing room screen */}
      <mesh position={[0, 0.8, -0.76]}>
        <boxGeometry args={[0.8, 0.4, 0.02]} />
        <meshStandardMaterial color="#1e293b" emissive="#334155" emissiveIntensity={0.5} />
      </mesh>
      {/* Armory — secure door with red light */}
      <mesh position={[-0.85, 0.3, -0.76]}>
        <boxGeometry args={[0.3, 0.5, 0.03]} />
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </mesh>
      <BlinkingLight position={[-0.85, 0.6, -0.78]} color="#ef4444" speed={1.5} />
      {/* Drone launch pad */}
      <mesh position={[0.7, 1.02, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 8]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
      {/* Communication tower */}
      <mesh position={[-0.8, 1.2, 0.5]}>
        <cylinderGeometry args={[0.02, 0.04, 1.4, 4]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, 1.95, 0.5]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0, 0.12, 0.06, 6]} />
        <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Flagpole + animated flag */}
      <mesh position={[0.9, 0.9, 0.7]}>
        <cylinderGeometry args={[0.015, 0.015, 1.8, 4]} />
        <meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={flagRef} position={[0.9, 1.65, 0.8]}>
        <boxGeometry args={[0.02, 0.2, 0.25]} />
        <meshStandardMaterial color="#ef4444" roughness={0.6} />
      </mesh>
    </group>
  )
}

/* ================================================
   Building model selector
   ================================================ */
function BuildingModel({ type }: { type: string }) {
  switch (type) {
    case 'hq': return <HQModel />
    case 'farm': return <FarmModel />
    case 'library': return <LibraryModel />
    case 'lab': return <LabModel />
    case 'server': return <ServerModel />
    case 'barracks': return <BarracksModel />
    default: return (
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#64748b" roughness={0.5} />
      </mesh>
    )
  }
}

/* ================================================
   Draggable Building wrapper (for edit mode)
   ================================================ */
export function Building({ building }: { building: BuildingType }) {
  const groupRef = useRef<THREE.Group>(null)
  const { selectedBuildingId, setSelectedBuilding, editMode, updateBuildingPosition, updateBuildingRotation, deleteBuilding } = useGameStore()
  const isSelected = selectedBuildingId === building.id
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<THREE.Vector3>(new THREE.Vector3())
  const initialPos = useRef<[number, number, number]>([0, 0, 0])
  const { raycaster, camera } = useThree()

  const template = BUILDING_TEMPLATES.find(t => t.type === building.type)
  const isUnderConstruction = building.status === 'under_construction'
  const isPlanned = building.status === 'planned'

  // Drag handling for edit mode
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!editMode) {
      e.stopPropagation()
      setSelectedBuilding(building.id)
      return
    }
    e.stopPropagation()
    setIsDragging(true)
    setSelectedBuilding(building.id)
    dragStart.current.copy(e.point)
    initialPos.current = [...building.position]
    ;(e.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId)
  }, [editMode, building.id, building.position, setSelectedBuilding])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !editMode) return
    e.stopPropagation()
    const delta = e.point.clone().sub(dragStart.current)
    const snap = (v: number) => Math.round(v * 2) / 2
    const newX = snap(initialPos.current[0] + delta.x)
    const newZ = snap(initialPos.current[2] + delta.z)
    updateBuildingPosition(building.id, [newX, 0, newZ])
  }, [isDragging, editMode, building.id, updateBuildingPosition])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // R key for rotation in edit mode
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (editMode && isSelected && e.key.toLowerCase() === 'r') {
      updateBuildingRotation(building.id, building.rotation + Math.PI / 2)
    }
  }, [editMode, isSelected, building.id, building.rotation, updateBuildingRotation])

  // Attach/detach keyboard listener
  useState(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  })

  return (
    <group
      ref={groupRef}
      position={building.position}
      rotation={[0, building.rotation, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setIsDragging(false) }}
    >
      {/* Edit mode glow outline */}
      {editMode && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[2.5, 2.5, 2.5]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={hovered ? 0.4 : 0.15}
            transparent
            opacity={0.08}
            wireframe
          />
        </mesh>
      )}

      {/* Under construction / planned overlay */}
      {isPlanned && (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#64748b" transparent opacity={0.2} wireframe />
        </mesh>
      )}

      {/* Building model */}
      <group scale={isPlanned ? [0.6, 0.6, 0.6] : [1, 1, 1]} >
        <BuildingModel type={building.type} />
      </group>

      {/* Construction progress bar */}
      {isUnderConstruction && (
        <group position={[0, 2.5, 0]}>
          <mesh>
            <boxGeometry args={[1, 0.08, 0.02]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-(1 - building.constructionProgress / 100) * 0.5, 0, 0.01]}>
            <boxGeometry args={[building.constructionProgress / 100, 0.06, 0.02]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}

      {/* Name + status label */}
      <Billboard position={[0, (building.type === 'hq' ? 4 : 2.2), 0]}>
        <Text
          fontSize={0.14}
          color={isSelected ? '#0ea5e9' : '#e2e8f0'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#0f172a"
        >
          {template?.emoji || '🏗️'} {building.name}
        </Text>
      </Billboard>

      {/* Status indicator */}
      <Billboard position={[0, (building.type === 'hq' ? 3.7 : 1.95), 0]}>
        <Text
          fontSize={0.09}
          color={building.status === 'active' ? '#22c55e' : building.status === 'under_construction' ? '#eab308' : '#64748b'}
          anchorX="center"
          anchorY="middle"
        >
          {building.status === 'active' ? '● Active' : building.status === 'under_construction' ? '◐ Building...' : '○ Planned'}
        </Text>
      </Billboard>

      {/* Level badge */}
      <Billboard position={[0.8, (building.type === 'hq' ? 3.7 : 1.95), 0]}>
        <Text fontSize={0.1} color="#94a3b8" anchorX="center" anchorY="middle">
          Lv.{building.level}
        </Text>
      </Billboard>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Edit mode delete button (shown on hover) */}
      {editMode && hovered && building.type !== 'hq' && (
        <Billboard position={[1.2, 2, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); deleteBuilding(building.id) }}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Text fontSize={0.12} color="#fff" anchorX="center" anchorY="middle" position={[0, 0, 0.01]}>
            ✕
          </Text>
        </Billboard>
      )}
    </group>
  )
}
