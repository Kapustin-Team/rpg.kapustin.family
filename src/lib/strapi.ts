const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN || ''

async function fetchStrapi<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api${path}?populate=*&pagination[limit]=100`, {
    headers: {
      'Content-Type': 'application/json',
      ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
    },
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error(`Strapi error: ${res.status} ${path}`)
  const json = await res.json()
  return json.data as T
}

export interface StrapiTask {
  id: number
  documentId: string
  title: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  dueDate?: string
  xpReward: number
  rpgCategory?: 'build' | 'research' | 'trade' | 'defense' | 'exploration'
  energyCost?: number
}

export interface StrapiAgentTask {
  id: number
  documentId: string
  title: string
  agentName: string
  taskType: string
  status: string
  labeledCount?: number
  totalCount?: number
  qualityScore?: number
  completedAt?: string
}

export interface StrapiRpgCharacter {
  id: number
  documentId: string
  name: string
  level: number
  xp: number
  xpToNextLevel: number
  class: string
  streakDays: number
  totalTasksCompleted: number
  stats?: Record<string, number>
}

export interface StrapiRpgBuilding {
  id: number
  documentId: string
  name: string
  buildingType: string
  level: number
  status: string
  positionX?: number
  positionY?: number
  positionZ?: number
  rotationY?: number
  constructionProgress: number
  model3dKey?: string
}

export interface StrapiRpgResource {
  id: number
  documentId: string
  name: string
  resourceType: string
  amount: number
  maxCapacity: number
  productionRate: number
  icon?: string
  color?: string
}

export const strapiApi = {
  tasks: () => fetchStrapi<StrapiTask[]>('/tasks?filters[status][$ne]=cancelled&sort=priority:desc,createdAt:desc'),
  agentTasks: () => fetchStrapi<StrapiAgentTask[]>('/agent-tasks?sort=createdAt:desc'),
  character: () => fetchStrapi<StrapiRpgCharacter[]>('/rpg-characters?pagination[limit]=1'),
  buildings: () => fetchStrapi<StrapiRpgBuilding[]>('/rpg-buildings?sort=createdAt:asc'),
  resources: () => fetchStrapi<StrapiRpgResource[]>('/rpg-resources'),
}
