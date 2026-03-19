export interface BuildingTemplate {
  type: string
  name: string
  emoji: string
  description: string
  costGold: number
  costWood: number
  costStone: number
  productionType: string
  productionRate: number
  workerSlots: number
  color: string
}

export const BUILDING_TEMPLATES: BuildingTemplate[] = [
  { type: "hq",       name: "HQ Command Center",    emoji: "🏢", description: "Центр управления — стеклянный небоскрёб",  costGold: 0,   costWood: 0,   costStone: 0,   productionType: "gold",      productionRate: 5,  workerSlots: 3, color: "#0ea5e9" },
  { type: "farm",     name: "Vertical Farm",         emoji: "🌿", description: "Вертикальная ферма с гидропоникой",       costGold: 50,  costWood: 30,  costStone: 0,   productionType: "food",      productionRate: 8,  workerSlots: 2, color: "#22c55e" },
  { type: "library",  name: "Digital Knowledge Hub",  emoji: "📡", description: "Цифровой хаб знаний",                    costGold: 80,  costWood: 60,  costStone: 20,  productionType: "knowledge", productionRate: 3,  workerSlots: 2, color: "#8b5cf6" },
  { type: "lab",      name: "AI Research Center",     emoji: "🔬", description: "Центр исследований ИИ",                  costGold: 150, costWood: 50,  costStone: 80,  productionType: "data",      productionRate: 12, workerSlots: 3, color: "#06b6d4" },
  { type: "server",   name: "Data Center",            emoji: "🖥️", description: "Дата-центр максимальной мощности",       costGold: 200, costWood: 30,  costStone: 120, productionType: "code",      productionRate: 8,  workerSlots: 2, color: "#64748b" },
  { type: "barracks", name: "Agent Training Academy",  emoji: "🎯", description: "Академия тренировки агентов",            costGold: 120, costWood: 100, costStone: 60,  productionType: "creativity",productionRate: 4,  workerSlots: 4, color: "#ef4444" },
]
