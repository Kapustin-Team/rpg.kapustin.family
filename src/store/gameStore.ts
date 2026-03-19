import { create } from 'zustand'
import { AGENTS, type Agent } from '@/data/agents'

export type ResourceType = 'gold' | 'food' | 'knowledge' | 'energy' | 'data' | 'code' | 'creativity'

export interface Resource {
  type: ResourceType
  amount: number
  maxCapacity: number
  productionRate: number
  icon: string
  color: string
  label: string
}

export interface Task {
  id: string
  documentId?: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  xpReward: number
  rpgCategory?: string
  dueDate?: string
  assignedTo?: string
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
  gold:       { icon: '🪙', color: '#f4c542', label: 'Gold' },
  food:       { icon: '🌾', color: '#84cc16', label: 'Food' },
  knowledge:  { icon: '📚', color: '#7c3aed', label: 'Knowledge' },
  energy:     { icon: '⚡', color: '#eab308', label: 'Energy' },
  data:       { icon: '💾', color: '#10b981', label: 'Data' },
  code:       { icon: '⚙️', color: '#06b6d4', label: 'Code' },
  creativity: { icon: '✨', color: '#ec4899', label: 'Creativity' },
}

const DEFAULT_RESOURCES: Resource[] = [
  { type: 'gold',       amount: 500,  maxCapacity: 2000, productionRate: 5,  ...RESOURCE_META.gold },
  { type: 'food',       amount: 200,  maxCapacity: 1000, productionRate: 8,  ...RESOURCE_META.food },
  { type: 'knowledge',  amount: 50,   maxCapacity: 500,  productionRate: 1,  ...RESOURCE_META.knowledge },
  { type: 'energy',     amount: 300,  maxCapacity: 1000, productionRate: 10, ...RESOURCE_META.energy },
  { type: 'data',       amount: 300,  maxCapacity: 5000, productionRate: 15, ...RESOURCE_META.data },
  { type: 'code',       amount: 80,   maxCapacity: 1000, productionRate: 4,  ...RESOURCE_META.code },
  { type: 'creativity', amount: 40,   maxCapacity: 300,  productionRate: 1,  ...RESOURCE_META.creativity },
]

const DEFAULT_CHARACTER: Character = {
  name: 'Дмитрий Капустин',
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  class: 'strategist',
  streakDays: 0,
  totalTasksCompleted: 0,
}

export interface PipelineStage {
  stage: 'assigned' | 'received' | 'started' | 'progress' | 'completed' | 'failed'
  timestamp: string
  message?: string
}

export interface TaskPipelineEntry {
  stages: PipelineStage[]
}

interface GameStore {
  character: Character
  resources: Resource[]
  tasks: Task[]
  agents: Agent[]
  isLoaded: boolean
  selectedAgentId: string | null
  xpAnimation: { taskId: string; amount: number } | null
  taskPipeline: Record<string, TaskPipelineEntry>

  setSelectedAgent: (id: string | null) => void
  assignTaskToAgent: (agentId: string, taskId: string) => void
  completeTask: (taskId: string) => void
  setTasks: (tasks: Task[]) => void
  clearXpAnimation: () => void
  loadFromStrapi: () => Promise<void>
  addPipelineStage: (taskId: string, stage: PipelineStage['stage'], message?: string) => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  character: DEFAULT_CHARACTER,
  resources: DEFAULT_RESOURCES,
  tasks: [],
  agents: AGENTS.map(a => ({ ...a })),
  isLoaded: false,
  selectedAgentId: null,
  xpAnimation: null,
  taskPipeline: typeof window !== 'undefined' ? (() => {
    try { return JSON.parse(localStorage.getItem('rpg-city:taskPipeline') || '{}') } catch { return {} }
  })() : {},

  setSelectedAgent: (id) => set({ selectedAgentId: id }),

  addPipelineStage: (taskId, stage, message) => set((state) => {
    const existing = state.taskPipeline[taskId] || { stages: [] }
    const newPipeline = {
      ...state.taskPipeline,
      [taskId]: {
        stages: [...existing.stages, { stage, timestamp: new Date().toISOString(), message }],
      },
    }
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('rpg-city:taskPipeline', JSON.stringify(newPipeline)) } catch {}
    }
    return { taskPipeline: newPipeline }
  }),

  setTasks: (tasks) => set({ tasks }),

  clearXpAnimation: () => set({ xpAnimation: null }),

  assignTaskToAgent: (agentId, taskId) => set((state) => {
    const newAgents = state.agents.map(a =>
      a.id === agentId ? { ...a, status: 'working' as const, currentTaskId: taskId } : a
    )
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('rpg-city:agentStates', JSON.stringify(newAgents.map(a => ({ id: a.id, status: a.status, currentTaskId: a.currentTaskId })))) } catch {}
    }
    return {
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, assignedTo: agentId, status: 'in_progress' as const } : t
      ),
      agents: newAgents,
    }
  }),

  completeTask: (taskId) => set((state) => {
    const task = state.tasks.find(t => t.id === taskId)
    if (!task || task.status === 'done') return state
    const xpGain = task.xpReward
    const newXp = state.character.xp + xpGain
    const levelUp = newXp >= state.character.xpToNextLevel
    return {
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'done' as const } : t),
      agents: state.agents.map(a =>
        a.currentTaskId === taskId ? { ...a, status: 'done' as const, currentTaskId: undefined } : a
      ),
      character: {
        ...state.character,
        xp: levelUp ? newXp - state.character.xpToNextLevel : newXp,
        level: levelUp ? state.character.level + 1 : state.character.level,
        xpToNextLevel: levelUp ? Math.floor(state.character.xpToNextLevel * 1.5) : state.character.xpToNextLevel,
        totalTasksCompleted: state.character.totalTasksCompleted + 1,
      },
      xpAnimation: { taskId, amount: xpGain },
    }
  }),

  loadFromStrapi: async () => {
    try {
      const res = await fetch('/api/tasks', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        const strapiTasks = (json.data || []).map((t: Record<string, unknown>) => ({
          id: String(t.id),
          documentId: t.documentId as string,
          title: (t.title as string) || 'Untitled',
          status: t.status === 'review' ? 'in_progress' : t.status === 'cancelled' ? 'todo' : (t.status || 'todo'),
          priority: (t.priority as string) || 'medium',
          xpReward: (t.xpReward as number) || 10,
          rpgCategory: t.rpgCategory as string,
          dueDate: t.dueDate as string,
        }))
        if (strapiTasks.length) {
          set({ tasks: strapiTasks as Task[] })
        }
      }
    } catch {
      // API unavailable
    }
    set({ isLoaded: true })
  },
}))
