# RPG City — Kapustin Family

North Gard-style 3D city builder where your tasks become in-game resources and buildings.

## Stack

- **Next.js 15** + React 19 + TypeScript
- **Three.js** + @react-three/fiber + @react-three/drei (3D city)
- **Zustand** (game state)
- **Framer Motion** (UI animations)
- **Strapi API** — tasks, buildings, resources from `strapi.kapustin.family`

## Game Mechanics

- Complete real tasks → earn XP → level up your character
- Tasks have RPG categories: build / research / trade / defense / exploration
- Resources: gold, food, wood, stone, knowledge, data, code, creativity
- 3D city grows as you complete tasks and unlock buildings

## Dev

```bash
npm install
npm run dev
```

## Deploy

GitHub Actions → Docker image → ghcr.io → Coolify

Domain: `rpg.kapustin.family`
