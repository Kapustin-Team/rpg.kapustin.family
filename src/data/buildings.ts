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
  { type: "hq",       name: "Штаб",               emoji: "🏰", description: "Центр управления",       costGold: 0,   costWood: 0,   costStone: 0,   productionType: "gold",      productionRate: 5,  workerSlots: 3, color: "#c9a84c" },
  { type: "farm",     name: "Ферма",              emoji: "🌾", description: "Производит еду",         costGold: 50,  costWood: 30,  costStone: 0,   productionType: "food",      productionRate: 8,  workerSlots: 2, color: "#4a7c4e" },
  { type: "library",  name: "Библиотека",         emoji: "📚", description: "Производит знания",      costGold: 80,  costWood: 60,  costStone: 20,  productionType: "knowledge", productionRate: 3,  workerSlots: 2, color: "#7c5c3e" },
  { type: "lab",      name: "Лаборатория данных", emoji: "🔬", description: "Производит данные+код",  costGold: 150, costWood: 50,  costStone: 80,  productionType: "data",      productionRate: 12, workerSlots: 3, color: "#1a6b8a" },
  { type: "server",   name: "Сервер",             emoji: "🖥️", description: "Максимальный код",       costGold: 200, costWood: 30,  costStone: 120, productionType: "code",      productionRate: 8,  workerSlots: 2, color: "#3a3a5c" },
  { type: "barracks", name: "Академия агентов",   emoji: "⚔️", description: "Тренировка агентов",     costGold: 120, costWood: 100, costStone: 60,  productionType: "creativity",productionRate: 4,  workerSlots: 4, color: "#6b1a1a" },
]
