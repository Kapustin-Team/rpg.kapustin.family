// localStorage helpers with safe JSON parse/stringify

const PREFIX = 'rpg-city:'

export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function lsSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value))
  } catch (err) {
    console.warn(`[LS] Failed to save ${key}:`, err)
  }
}

export function lsRemove(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${PREFIX}${key}`)
}
