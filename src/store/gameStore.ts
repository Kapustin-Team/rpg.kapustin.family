import { create } from 'zustand'

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

interface GameStore {
  character: Character
  resources: Resource[]
  buildings: Building[]
  tasks: Task[]
  selectedBuildingId: string | null
  isPanelOpen: boolean
  setSelectedBuilding: (id: string | null) => void
  setIsPanelOpen: (open: boolean) => void
  completeTask: (taskId: string) => void
  addBuilding: (building: Building) => void
  tickResources: () => void
}

const defaultResources: Resource[] = [
  { type: 'gold', amount: 500, maxCapacity: 2000, productionRate: 5, icon: '🪙', color: '#f4c542', label: 'Золото' },
  { type: 'food', amount: 200, maxCapacity: 1000, productionRate: 8, icon: '🌾', color: '#84cc16', label: 'Еда' },
  { type: 'wood', amount: 150, maxCapacity: 800, productionRate: 3, icon: '🪵', color: '#8b5e3c', label: 'Дерево' },
  { type: 'stone', amount: 100, maxCapacity: 600, productionRate: 2, icon: '🪨', color: '#6b7280', label: 'Камень' },
  { type: 'knowledge', amount: 50, maxCapacity: 500, productionRate: 1, icon: '📚', color: '#7c3aed', label: 'Знание' },
  { type: 'data', amount: 300, maxCapacity: 5000, productionRate: 15, icon: '💾', color: '#10b981', label: 'Данные' },
  { type: 'code', amount: 80, maxCapacity: 1000, productionRate: 4, icon: '⚙️', color: '#06b6d4', label: 'Код' },
  { type: 'creativity', amount: 40, maxCapacity: 300, productionRate: 1, icon: '✨', color: '#ec4899', label: 'Креатив' },
]

const defaultBuildings: Building[] = [
  { id: 'hq', name: 'Штаб', type: 'tower', level: 1, position: [0, 0, 0], status: 'active', constructionProgress: 100 },
  { id: 'farm1', name: 'Ферма', type: 'farm', level: 1, position: [-4, 0, 2], status: 'active', constructionProgress: 100 },
  { id: 'lib1', name: 'Библиотека', type: 'library', level: 1, position: [4, 0, -2], status: 'active', constructionProgress: 100 },
  { id: 'lab1', name: 'Лаборатория данных', type: 'lab', level: 1, position: [3, 0, 3], status: 'under_construction', constructionProgress: 45 },
  { id: 'server1', name: 'Сервер', type: 'server', level: 1, position: [-3, 0, -3], status: 'planned', constructionProgress: 0 },
]

const defaultTasks: Task[] = [
  { id: '1', title: 'Запустить RPG MVP', status: 'in_progress', priority: 'high', xpReward: 100, rpgCategory: 'build', dueDate: '2026-04-01' },
  { id: '2', title: 'Обновить Strapi схемы', status: 'done', priority: 'medium', xpReward: 30, rpgCategory: 'research' },
  { id: '3', title: 'Настроить CI/CD', status: 'todo', priority: 'high', xpReward: 50, rpgCategory: 'build' },
  { id: '4', title: 'Разметить датасет агентов', status: 'todo', priority: 'medium', xpReward: 40, rpgCategory: 'research' },
]

export const useGameStore = create<GameStore>((set) => ({
  character: {
    name: 'Дмитрий Капустин',
    level: 12,
    xp: 2340,
    xpToNextLevel: 3000,
    class: 'strategist',
    streakDays: 7,
    totalTasksCompleted: 134,
  },
  resources: defaultResources,
  buildings: defaultBuildings,
  tasks: defaultTasks,
  selectedBuildingId: null,
  isPanelOpen: false,

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),

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

  addBuilding: (building) => set((state) => ({
    buildings: [...state.buildings, building],
  })),

  tickResources: () => set((state) => ({
    resources: state.resources.map(r => ({
      ...r,
      amount: Math.min(r.maxCapacity, r.amount + r.productionRate * 0.1),
    })),
  })),
}))
