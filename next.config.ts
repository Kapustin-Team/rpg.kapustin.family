import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      const reactPath = path.resolve(__dirname, 'node_modules/react')
      const reactDomPath = path.resolve(__dirname, 'node_modules/react-dom')
      config.resolve.alias = {
        ...config.resolve.alias,
        react: reactPath,
        'react-dom': reactDomPath,
      }
    }
    return config
  },
}

export default nextConfig
