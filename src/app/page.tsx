'use client'

import dynamic from 'next/dynamic'
import { HUD } from '@/components/ui/HUD'
import { TaskPanel } from '@/components/ui/TaskPanel'
import { ResourceBar } from '@/components/ui/ResourceBar'

// Three.js работает только на клиенте
const CityScene = dynamic(() => import('@/components/city/CityScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#0a0f1a', color: '#f4c542', fontSize: 18
    }}>
      Загрузка города...
    </div>
  ),
})

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <CityScene />
      <ResourceBar />
      <HUD />
      <TaskPanel />
    </main>
  )
}
