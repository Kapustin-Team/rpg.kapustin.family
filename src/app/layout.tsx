import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'North Gard — Kapustin Kingdom',
  description: 'North Gard-style 3D city builder with task & resource management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
