// In-process event bus for SSE broadcasting + detailed logging

import { logEvent } from '@/lib/strapi-logger'

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
const MAX_ACTIVITY = 100

export function subscribe(cb: Callback) {
  subscribers.add(cb)
  console.log(`[SSE] 🟢 Client subscribed. Total clients: ${subscribers.size}`)
}

export function unsubscribe(cb: Callback) {
  subscribers.delete(cb)
  console.log(`[SSE] 🔴 Client unsubscribed. Total clients: ${subscribers.size}`)
}

export function broadcast(type: string, data: Record<string, unknown>) {
  const event: SSEEvent = {
    type,
    data,
    timestamp: new Date().toISOString(),
  }
  console.log(`[SSE] 📡 Broadcasting "${type}" to ${subscribers.size} clients:`, JSON.stringify(data))
  let sent = 0
  let failed = 0
  for (const cb of subscribers) {
    try {
      cb(event)
      sent++
    } catch (err) {
      failed++
      console.error(`[SSE] ❌ Failed to send to client:`, err)
    }
  }
  console.log(`[SSE] 📡 Broadcast complete: ${sent} sent, ${failed} failed`)
}

/** Persist an activity to Strapi rpg-events (fire-and-forget) */
function persistToStrapi(activity: ActivityItem) {
  console.log(`[LOG] 💾 Persisting activity to Strapi: ${activity.type} — ${activity.message.slice(0, 100)}`)
  logEvent(
    `activity:${activity.type}`,
    activity.message,
    activity.agentId,
    { taskId: activity.taskId, activityId: activity.id, timestamp: activity.timestamp },
  ).catch((err) => {
    console.error(`[LOG] ❌ Strapi persist failed (non-blocking):`, err)
  })
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
  console.log(`[ACTIVITY] ➕ Added: ${activity.message} (total: ${activityLog.length})`)

  // Also persist to Strapi rpg-events
  persistToStrapi(activity)

  return activity
}

export function getActivities(): ActivityItem[] {
  return [...activityLog]
}
