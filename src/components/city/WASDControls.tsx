'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import * as THREE from 'three'

const MOVE_SPEED = 10

export function WASDControls() {
  const { camera } = useThree()
  const keys = useRef<Record<string, boolean>>({})
  const direction = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't capture if user is typing in an input
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
    const key = e.key.toLowerCase()
    if (['w', 'a', 's', 'd'].includes(key)) {
      keys.current[key] = true
    }
  }, [])

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (['w', 'a', 's', 'd'].includes(key)) {
      keys.current[key] = false
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [onKeyDown, onKeyUp])

  useFrame((state, delta) => {
    const k = keys.current
    if (!k.w && !k.a && !k.s && !k.d) return

    // Get camera's forward direction projected onto XZ plane
    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()

    // Right vector
    right.current.crossVectors(forward.current, camera.up).normalize()

    direction.current.set(0, 0, 0)

    if (k.w) direction.current.add(forward.current)
    if (k.s) direction.current.sub(forward.current)
    if (k.d) direction.current.add(right.current)
    if (k.a) direction.current.sub(right.current)

    if (direction.current.lengthSq() > 0) {
      direction.current.normalize()
      const move = direction.current.multiplyScalar(MOVE_SPEED * delta)
      camera.position.add(move)

      // Also move OrbitControls target (makeDefault stores it on state.controls)
      const controls = state.controls as unknown as OrbitControlsType
      if (controls && controls.target) {
        controls.target.add(move.clone())
      }
    }
  })

  return null
}
