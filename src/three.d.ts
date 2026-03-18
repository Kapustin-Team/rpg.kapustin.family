/// <reference types="@react-three/fiber" />

import type { Object3DNode } from '@react-three/fiber'
import type { Mesh, Group, DirectionalLight, AmbientLight, PointLight } from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<Group, typeof Group>
      mesh: Object3DNode<Mesh, typeof Mesh>
      ambientLight: Object3DNode<AmbientLight, typeof AmbientLight>
      directionalLight: Object3DNode<DirectionalLight, typeof DirectionalLight>
      pointLight: Object3DNode<PointLight, typeof PointLight>
      boxGeometry: any
      coneGeometry: any
      planeGeometry: any
      circleGeometry: any
      meshStandardMaterial: any
    }
  }
}
