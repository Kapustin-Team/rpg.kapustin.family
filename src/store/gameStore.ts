import { create } from 'zustand'
import {
  StrapiTask, StrapiRpgBuilding, StrapiRpgResource, StrapiRpgCharacter,
  strapiApi
} from '@/lib/strapi'

export type ResourceType = 'gold' | 'food' | 'wood' | 'stone' | 'knowledge' | 'energy' | 'data' | 'code' | 'creativity'

export interface Resource {
  type: ResourceType
  amount: number
  maxCapacity: number
  productionRate: number
  icon: string
  color: string
  label: string
}

export interface Building {
  id: string
  name: string
  type: string
  level: number
  position: [number, number, number]
  status: 'planned' | 'under_construction' | 'active'
  constructionProgress: number
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  xpReward: number
  rpgCategory?: 'build' | 'research' | 'trade' | 'defense' | 'exploration'
  dueDate?: string
}

export interface Character {
  name: string
  level: number
  xp: number
  xpToNextLevel: number
  class: string
  streakDays: number
  totalTasksCompleted: number
}

const RESOURCE_META: Record<string, { icon: string; color: string; label: string }> = {
  gold:       { icon: '🪙', color: '#f4c542', label: 'Золото' },
  food:       { icon: '🌾', color: '#84cc16', label: 'Еда' },
  wood:       { icon: '🪵', color: '#8b5e3c', label: 'Дерево' },
  stone:      { icon: '🪨', color: '#6b7280', label: 'Камень' },
  knowledge:  { icon: '📚', color: '#7c3aed', label: 'Знание' },
  energy:     { icon: '⚡', color: '#eab308', label: 'Энергия' },
  data:       { icon: '💾', color: '#10b981', label: 'Данные' },
  code:       { icon: '⚙️', color: '#06b6d4', label: 'Код' },
  creativity: { icon: '✨', color: '#ec4899', label: 'Креатив' },
}

const DEFAULT_RESOURCES: Resource[] = [
  { type: 'gold',       amount: 500,  maxCapacity: 2000, productionRate: 5,  ...RESOURCE_META.gold },
  { type: 'food',       amount: 200,  maxCapacity: 1000, productionRate: 8,  ...RESOURCE_META.food },
  { type: 'knowledge',  amount: 50,   maxCapacity: 500,  productionRate: 1,  ...RESOURCE_META.knowledge },
  { type: 'data',       amount: 300,  maxCapacity: 5000, productionRate: 15, ...RESOURCE_META.data },
  { type: 'code',       amount: 80,   maxCapacity: 1000, productionRate: 4,  ...RESOURCE_META.code },
  { type: 'creativity', amount: 40,   maxCapacity: 300,  productionRate: 1,  ...RESOURCE_META.creativity },
]

const DEFAULT_BUILDINGS: Building[] = [
  { id: 'hq',      name: 'Штаб',                type: 'tower',   level: 1, position: [0, 0, 0],    status: 'active',              constructionProgress: 100 },
  { id: 'farm1',   name: 'Ферма',               type: 'farm',    level: 1, position: [-4, 0, 2],   status: 'active',              constructionProgress: 100 },
  { id: 'lib1',    name: 'Библиотека',          type: 'library', level: 1, position: [4, 0, -2],   status: 'active',              constructionProgress: 100 },
  { id: 'lab1',    name: 'Лаборатория данных',  type: 'lab',     level: 1, position: [3, 0, 3],    status: 'under_construction',  constructionProgress: 45 },
  { id: 'server1', name: 'Сервер',              type: 'server',  level: 1, position: [-3, 0, -3],  status: 'planned',             constructionProgress: 0 },
]

const DEFAULT_CHARACTER: Character = {
  name: 'Дмитрий Капустин',
  level: 1, xp: 0, xpToNextLevel: 100,
  class: 'strategist', streakDays: 0, totalTasksCompleted: 0,
}

function mapStrapiBuilding(b: StrapiRpgBuilding): Building {
  return {
    id: b.documentId,
    name: b.name,
    type: b.buildingType,
    level: b.level,
    position: [b.positionX ?? 0, b.positionY ?? 0, b.positionZ ?? 0],
    status: b.status as Building['status'],
    constructionProgress: b.constructionProgress,
  }
}

function mapStrapiResource(r: StrapiRpgResource): Resource {
  const meta = RESOURCE_META[r.resourceType] || { icon: '📦', color: '#6b7280', label: r.name }
  return {
    type: r.resourceType as ResourceType,
    amount: r.amount,
    maxCapacity: r.maxCapacity,
    productionRate: r.productionRate,
    ...meta,
  }
}

function mapStrapiCharacter(c: StrapiRpgCharacter): Character {
  return {
    name: c.name,
    level: c.level,
    xp: c.xp,
    xpToNextLevel: c.xpToNextLevel,
    class: c.class,
    streakDays: c.streakDays,
    totalTasksCompleted: c.totalTasksCompleted,
  }
}

function mapStrapiTask(t: StrapiTask): Task {
  return {
    id: String(t.id),
    title: t.title,
    status: t.status === 'review' ? 'in_progress' : t.status === 'cancelled' ? 'todo' : t.status,
    priority: t.priority,
    xpReward: t.xpReward ?? 10,
    rpgCategory: t.rpgCategory,
    dueDate: t.dueDate,
  }
}

interface GameStore {
  character: Character
  resources: Resource[]
  buildings: Building[]
  tasks: Task[]
  isLoaded: boolean
  selectedBuildingId: string | null
  isPanelOpen: boolean
  setSelectedBuilding: (id: string | null) => void
  setIsPanelOpen: (open: boolean) => void
  completeTask: (taskId: string) => void
  tickResources: () => void
  loadFromStrapi: () => Promise<void>
}

export const useGameStore = create<GameStore>((set, get) => ({
  character: DEFAULT_CHARACTER,
  resources: DEFAULT_RESOURCES,
  buildings: DEFAULT_BUILDINGS,
  tasks: [],
  isLoaded: false,
  selectedBuildingId: null,
  isPanelOpen: false,

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),

  loadFromStrapi: async () => {
    try {
      const [tasks, buildings, resources, characters] = await Promise.allSettled([
        strapiApi.tasks(),
        strapiApi.buildings(),
        strapiApi.resources(),
        strapiApi.character(),
      ])

      set({
        isLoaded: true,
        tasks: tasks.status === 'fulfilled' && tasks.value?.length
          ? tasks.value.map(mapStrapiTask)
          : get().tasks,
        buildings: buildings.status === 'fulfilled' && buildings.value?.length
          ? buildings.value.map(mapStrapiBuilding)
          : get().buildings,
        resources: resources.status === 'fulfilled' && resources.value?.length
          ? resources.value.map(mapStrapiResource)
          : get().resources,
        character: characters.status === 'fulfilled' && characters.value?.[0]
          ? mapStrapiCharacter(characters.value[0])
          : get().character,
      })
    } catch {
      set({ isLoaded: true })
    }
  },

  completeTask: (taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task || task.status === 'done') return state
    const xpGain = task.xpReward
    const newXp = state.character.xp + xpGain
    const levelUp = newXp >= state.character.xpToNextLevel
    return {
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'done' as const } : t),
      character: {
        ...state.character,
        xp: levelUp ? newXp - state.character.xpToNextLevel : newXp,
        level: levelUp ? state.character.level + 1 : state.character.level,
        xpToNextLevel: levelUp ? Math.floor(state.character.xpToNextLevel * 1.5) : state.character.xpToNextLevel,
        totalTasksCompleted: state.character.totalTasksCompleted + 1,
      }
    }
  }),

  tickResources: () => set((state) => ({
    resources: state.resources.map(r => ({
      ...r,
      amount: Math.min(r.maxCapacity, r.amount + r.productionRate * 0.1),
    })),
  })),
}))
