// In-process event bus for SSE broadcasting

export interface SSEEvent {
  type: string
  data: Record<string, unknown>
  timestamp: string
}

export interface ActivityItem {
  id: string
  type: string
  message: string
  timestamp: string
  agentId?: string
  taskId?: string
}

type Callback = (event: SSEEvent) => void

const subscribers: Set<Callback> = new Set()
const activityLog: ActivityItem[] = []
const MAX_ACTIVITY = 50

export function subscribe(cb: Callback) {
  subscribers.add(cb)
}

export function unsubscribe(cb: Callback) {
  subscribers.delete(cb)
}

export function broadcast(type: string, data: Record<string, unknown>) {
  const event: SSEEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  }
  for (const cb of subscribers) {
    try {
      cb(event)
    } catch {
      // ignore failed subscribers
    }
  }
}

export function addActivity(item: Omit<ActivityItem, 'id' | 'timestamp'>) {
  const activity: ActivityItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  }
  activityLog.unshift(activity)
  if (activityLog.length > MAX_ACTIVITY) {
    activityLog.length = MAX_ACTIVITY
  }
  return activity
}

export function getActivities(): ActivityItem[] {
  return [...activityLog]
}
