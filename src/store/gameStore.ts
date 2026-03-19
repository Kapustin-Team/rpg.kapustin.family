import { create } from 'zustand'
import {
  StrapiTask, StrapiRpgBuilding, StrapiRpgResource, StrapiRpgCharacter,
  strapiApi
} from '@/lib/strapi'
import { AGENTS, type Agent } from '@/data/agents'
import { BUILDING_TEMPLATES } from '@/data/buildings'

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
  rotation: number
  status: 'planned' | 'under_construction' | 'active'
  constructionProgress: number
}

export interface EnvironmentObject {
  id: string
  type: 'tree' | 'bench' | 'streetlight' | 'ev_charger' | 'bush' | 'planter' | 'car'
  position: [number, number, number]
  rotation: number
}

export interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  xpReward: number
  rpgCategory?: 'build' | 'research' | 'trade' | 'defense' | 'exploration' | 'frontend' | 'backend' | 'devops' | 'content' | 'health'
  dueDate?: string
  assignedTo?: string
  resourceReward?: {
    gold?: number
    food?: number
    knowledge?: number
    data?: number
    code?: number
    creativity?: number
  }
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
  { type: 'wood',       amount: 150,  maxCapacity: 1000, productionRate: 3,  ...RESOURCE_META.wood },
  { type: 'stone',      amount: 100,  maxCapacity: 1000, productionRate: 2,  ...RESOURCE_META.stone },
  { type: 'knowledge',  amount: 50,   maxCapacity: 500,  productionRate: 1,  ...RESOURCE_META.knowledge },
  { type: 'data',       amount: 300,  maxCapacity: 5000, productionRate: 15, ...RESOURCE_META.data },
  { type: 'code',       amount: 80,   maxCapacity: 1000, productionRate: 4,  ...RESOURCE_META.code },
  { type: 'creativity', amount: 40,   maxCapacity: 300,  productionRate: 1,  ...RESOURCE_META.creativity },
]

const DEFAULT_BUILDINGS: Building[] = [
  { id: 'hq',      name: 'HQ Command Center',     type: 'hq',      level: 1, position: [0, 0, 0],    rotation: 0, status: 'active',              constructionProgress: 100 },
  { id: 'farm1',   name: 'Vertical Farm',          type: 'farm',    level: 1, position: [-5, 0, 3],   rotation: 0, status: 'active',              constructionProgress: 100 },
  { id: 'lib1',    name: 'Digital Knowledge Hub',   type: 'library', level: 1, position: [5, 0, -3],   rotation: 0, status: 'active',              constructionProgress: 100 },
  { id: 'lab1',    name: 'AI Research Center',      type: 'lab',     level: 1, position: [4, 0, 4],    rotation: 0, status: 'under_construction',  constructionProgress: 45 },
  { id: 'server1', name: 'Data Center',             type: 'server',  level: 1, position: [-4, 0, -4],  rotation: 0, status: 'planned',             constructionProgress: 0 },
]

const DEFAULT_ENVIRONMENT: EnvironmentObject[] = [
  { id: 'tree1', type: 'tree', position: [8, 0, 8], rotation: 0 },
  { id: 'tree2', type: 'tree', position: [-8, 0, 6], rotation: 0.5 },
  { id: 'tree3', type: 'tree', position: [7, 0, -7], rotation: 1.2 },
  { id: 'tree4', type: 'tree', position: [-6, 0, -8], rotation: 2.1 },
  { id: 'tree5', type: 'tree', position: [10, 0, 0], rotation: 0.8 },
  { id: 'bench1', type: 'bench', position: [2, 0, -2], rotation: 0 },
  { id: 'bench2', type: 'bench', position: [-2, 0, 2], rotation: Math.PI / 2 },
  { id: 'light1', type: 'streetlight', position: [3, 0, 0], rotation: 0 },
  { id: 'light2', type: 'streetlight', position: [-3, 0, 0], rotation: 0 },
  { id: 'light3', type: 'streetlight', position: [0, 0, 3], rotation: 0 },
  { id: 'light4', type: 'streetlight', position: [0, 0, -3], rotation: 0 },
  { id: 'ev1', type: 'ev_charger', position: [6, 0, 0], rotation: 0 },
  { id: 'bush1', type: 'bush', position: [1, 0, 5], rotation: 0 },
  { id: 'bush2', type: 'bush', position: [-1, 0, 5], rotation: 0 },
  { id: 'bush3', type: 'bush', position: [3, 0, 6], rotation: 0 },
  { id: 'planter1', type: 'planter', position: [2, 0, 1], rotation: 0 },
  { id: 'planter2', type: 'planter', position: [-2, 0, -1], rotation: 0 },
  { id: 'car1', type: 'car', position: [8, 0, -3], rotation: 0 },
  { id: 'car2', type: 'car', position: [8.5, 0, -1.5], rotation: 0 },
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
    rotation: 0,
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
  environmentObjects: EnvironmentObject[]
  tasks: Task[]
  agents: Agent[]
  isLoaded: boolean
  selectedBuildingId: string | null
  selectedAgentId: string | null
  buildingPlacementType: string | null
  isPanelOpen: boolean
  editMode: boolean

  setSelectedBuilding: (id: string | null) => void
  setIsPanelOpen: (open: boolean) => void
  setSelectedAgent: (id: string | null) => void
  assignTaskToAgent: (agentId: string, taskId: string) => void
  setBuildingPlacementType: (type: string | null) => void
  placeBuilding: (type: string, position: [number, number, number]) => void
  completeTask: (taskId: string) => void
  tickResources: () => void
  loadFromStrapi: () => Promise<void>
  setEditMode: (on: boolean) => void
  updateBuildingPosition: (id: string, position: [number, number, number]) => void
  updateBuildingRotation: (id: string, rotation: number) => void
  deleteBuilding: (id: string) => void
  updateEnvironmentPosition: (id: string, position: [number, number, number]) => void
  updateEnvironmentRotation: (id: string, rotation: number) => void
  deleteEnvironment: (id: string) => void
  moveAgentTo: (agentId: string, position: [number, number, number]) => void
  moveAgentToBuilding: (agentId: string, buildingId: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  character: DEFAULT_CHARACTER,
  resources: DEFAULT_RESOURCES,
  buildings: DEFAULT_BUILDINGS,
  environmentObjects: DEFAULT_ENVIRONMENT,
  tasks: [],
  agents: AGENTS.map(a => ({ ...a })),
  isLoaded: false,
  selectedBuildingId: null,
  selectedAgentId: null,
  buildingPlacementType: null,
  isPanelOpen: false,
  editMode: false,

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
  setSelectedAgent: (id) => set({ selectedAgentId: id }),
  setEditMode: (on) => set({ editMode: on }),

  setBuildingPlacementType: (type) => set({ buildingPlacementType: type }),

  updateBuildingPosition: (id, position) => set((state) => ({
    buildings: state.buildings.map(b => b.id === id ? { ...b, position } : b),
  })),

  updateBuildingRotation: (id, rotation) => set((state) => ({
    buildings: state.buildings.map(b => b.id === id ? { ...b, rotation } : b),
  })),

  deleteBuilding: (id) => set((state) => ({
    buildings: state.buildings.filter(b => b.id !== id),
  })),

  updateEnvironmentPosition: (id, position) => set((state) => ({
    environmentObjects: state.environmentObjects.map(o => o.id === id ? { ...o, position } : o),
  })),

  updateEnvironmentRotation: (id, rotation) => set((state) => ({
    environmentObjects: state.environmentObjects.map(o => o.id === id ? { ...o, rotation } : o),
  })),

  deleteEnvironment: (id) => set((state) => ({
    environmentObjects: state.environmentObjects.filter(o => o.id !== id),
  })),

  moveAgentTo: (agentId, position) => set((state) => ({
    agents: state.agents.map(a =>
      a.id === agentId ? { ...a, status: 'moving' as const, targetPosition: position as [number, number, number] } : a
    ),
  })),

  moveAgentToBuilding: (agentId, buildingId) => {
    const state = get()
    const building = state.buildings.find(b => b.id === buildingId)
    if (!building) return
    const pos: [number, number, number] = [building.position[0] + 1, 0, building.position[2] + 1]
    set({
      agents: state.agents.map(a =>
        a.id === agentId ? { ...a, status: 'moving' as const, targetPosition: pos } : a
      ),
    })
  },

  assignTaskToAgent: (agentId, taskId) => set((state) => ({
    tasks: state.tasks.map(t =>
      t.id === taskId ? { ...t, assignedTo: agentId, status: 'in_progress' as const } : t
    ),
    agents: state.agents.map(a =>
      a.id === agentId ? { ...a, status: 'working' as const, currentTaskId: taskId } : a
    ),
  })),

  placeBuilding: (type, position) => set((state) => {
    const template = BUILDING_TEMPLATES.find(t => t.type === type)
    if (!template) return state

    const gold = state.resources.find(r => r.type === 'gold')
    const wood = state.resources.find(r => r.type === 'wood')
    const stone = state.resources.find(r => r.type === 'stone')

    if ((gold?.amount ?? 0) < template.costGold ||
        (wood?.amount ?? 0) < template.costWood ||
        (stone?.amount ?? 0) < template.costStone) {
      return state
    }

    const newBuilding: Building = {
      id: `${type}_${Date.now()}`,
      name: template.name,
      type: template.type,
      level: 1,
      position,
      rotation: 0,
      status: 'active',
      constructionProgress: 100,
    }

    return {
      buildings: [...state.buildings, newBuilding],
      resources: state.resources.map(r => {
        if (r.type === 'gold') return { ...r, amount: r.amount - template.costGold }
        if (r.type === 'wood') return { ...r, amount: r.amount - template.costWood }
        if (r.type === 'stone') return { ...r, amount: r.amount - template.costStone }
        return r
      }),
    }
  }),

  loadFromStrapi: async () => {
    try {
      let proxyTasks: Task[] = []
      try {
        const proxyRes = await fetch('/api/tasks')
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json()
          if (proxyData.tasks?.length) {
            proxyTasks = proxyData.tasks.map((t: { id: number; attributes?: { title: string; status: string; priority: string; rpgCategory?: string; resourceReward?: Task['resourceReward'] } }) => ({
              id: String(t.id),
              title: t.attributes?.title || 'Unknown task',
              status: (t.attributes?.status === 'review' ? 'in_progress' : t.attributes?.status === 'cancelled' ? 'todo' : t.attributes?.status || 'todo') as Task['status'],
              priority: (t.attributes?.priority || 'medium') as Task['priority'],
              xpReward: 10,
              rpgCategory: t.attributes?.rpgCategory as Task['rpgCategory'],
              resourceReward: t.attributes?.resourceReward,
            }))
          }
        }
      } catch {
        // proxy unavailable
      }

      const [tasks, buildings, resources, characters] = await Promise.allSettled([
        strapiApi.tasks(),
        strapiApi.buildings(),
        strapiApi.resources(),
        strapiApi.character(),
      ])

      const strapiTasks = tasks.status === 'fulfilled' && tasks.value?.length
        ? tasks.value.map(mapStrapiTask)
        : []

      set({
        isLoaded: true,
        tasks: proxyTasks.length ? proxyTasks : (strapiTasks.length ? strapiTasks : get().tasks),
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
    const reward = task.resourceReward || {}
    return {
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'done' as const } : t),
      agents: state.agents.map(a =>
        a.currentTaskId === taskId ? { ...a, status: 'idle' as const, currentTaskId: undefined } : a
      ),
      resources: state.resources.map(r => {
        const bonus = reward[r.type as keyof typeof reward] || 0
        return bonus > 0 ? { ...r, amount: Math.min(r.maxCapacity, r.amount + bonus) } : r
      }),
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
