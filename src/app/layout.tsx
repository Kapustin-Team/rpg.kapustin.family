import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RPG City — Agent & Task Control Panel',
  description: 'Agent & Task Control Panel for Kapustin Team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
