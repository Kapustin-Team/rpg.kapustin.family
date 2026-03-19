export interface Agent {
  id: string
  name: string
  role: string
  emoji: string
  color: string
  description: string
  specialization: string[]
  position: [number, number, number]
  targetPosition?: [number, number, number]
  status: "idle" | "working" | "moving" | "done"
  currentTaskId?: string
  sessionKey: string
}

export const AGENTS: Agent[] = [
  {
    id: "milena",
    name: "Milena Markovic",
    role: "Commander",
    emoji: "👩‍💼",
    color: "#1e3a5f",
    description: "Project commander, orchestrator",
    specialization: ["management", "strategy", "coordination"],
    position: [1, 0, 1],
    status: "idle",
    sessionKey: "agent:main:main"
  },
  {
    id: "aleksandra",
    name: "Aleksandra Avramovic",
    role: "Developer",
    emoji: "💻",
    color: "#6b21a8",
    description: "Fullstack developer, Next.js + Strapi",
    specialization: ["frontend", "backend", "devops"],
    position: [-1, 0, 1],
    status: "working",
    sessionKey: "agent:main-aleksandra:main"
  },
  {
    id: "kristina",
    name: "Kristina Kovac",
    role: "Content",
    emoji: "🍬",
    color: "#db2777",
    description: "Content manager",
    specialization: ["content", "social", "marketing"],
    position: [2, 0, -1],
    status: "idle",
    sessionKey: "agent:main-sladosti:main"
  },
  {
    id: "danijela",
    name: "Danijela Dragic",
    role: "Archivist",
    emoji: "📚",
    color: "#15803d",
    description: "Knowledge manager, Obsidian vault",
    specialization: ["research", "analysis", "knowledge"],
    position: [-2, 0, -1],
    status: "idle",
    sessionKey: "agent:main-danijela:main"
  },
  {
    id: "jovana",
    name: "Jovana Jovanovic",
    role: "Health Analyst",
    emoji: "🏃",
    color: "#7c3aed",
    description: "Health and fitness data analyst",
    specialization: ["health", "data", "analytics"],
    position: [0, 0, 3],
    status: "idle",
    sessionKey: "agent:main-jovana:main"
  }
]
