export interface Agent {
  id: string
  name: string
  role: string
  emoji: string
  color: string
  description: string
  specialization: string[]
  position: [number, number, number]
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
    color: "#e8a87c",
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
    color: "#7ec8e3",
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
    color: "#f7a8d8",
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
    color: "#a8d8a8",
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
    color: "#d4a8e8",
    description: "Health and fitness data analyst",
    specialization: ["health", "data", "analytics"],
    position: [0, 0, 3],
    status: "idle",
    sessionKey: "agent:main-jovana:main"
  }
]
