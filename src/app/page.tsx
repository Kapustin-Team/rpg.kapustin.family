'use client'

import dynamic from 'next/dynamic'
import HUD from '@/components/ui/HUD'
import TaskPanel from '@/components/ui/TaskPanel'
import ResourceBar from '@/components/ui/ResourceBar'
import AgentPanel from '@/components/ui/AgentPanel'
import BuildMenu from '@/components/ui/BuildMenu'

const CityScene = dynamic(() => import('@/components/city/CityScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', gap: 20,
    }}>
      <div className="ng-spinner" />
      <div style={{
        fontFamily: 'Cinzel, serif',
        color: '#c9a84c',
        fontSize: 18,
        letterSpacing: 2,
        animation: 'ng-pulse 2s ease-in-out infinite',
      }}>
        Loading your kingdom...
      </div>
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
      <AgentPanel />
      <BuildMenu />
    </main>
  )
}
