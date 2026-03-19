// Centralized Strapi event logger — writes to rpg-events collection

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.NEXT_PUBLIC_STRAPI_TOKEN || ''

// Valid Strapi rpg-event eventType enum values
type StrapiEventType =
  | 'task_completed'
  | 'building_built'
  | 'level_up'
  | 'resource_gained'
  | 'achievement_unlocked'
  | 'agent_task_done'
  | 'streak_milestone'
  | 'city_expanded'

// Map our internal event types to valid Strapi enum values
const EVENT_TYPE_MAP: Record<string, StrapiEventType> = {
  'task:assigned': 'agent_task_done',
  'task:completed': 'task_completed',
  'task:updated': 'agent_task_done',
  'task:status': 'agent_task_done',
  'task-assigned': 'agent_task_done',
  'task-completed': 'task_completed',
  'task-updated': 'agent_task_done',
  'task-status': 'agent_task_done',
  'activity:task-assigned': 'agent_task_done',
  'activity:task-completed': 'task_completed',
  'activity:task-updated': 'agent_task_done',
  'activity:task-status': 'agent_task_done',
  'activity:system-log': 'agent_task_done',
}

export interface StrapiEventPayload {
  eventType: string
  description: string
  agentId?: string
  metadata?: Record<string, unknown>
}

export async function logEvent(
  eventType: string,
  description: string,
  agentId?: string,
  metadata?: Record<string, unknown>,
): Promise<{ ok: boolean; id?: number }> {
  const ts = new Date().toISOString()
  const tag = '[STRAPI]'

  // Map to valid Strapi enum value
  const strapiEventType = EVENT_TYPE_MAP[eventType] || 'agent_task_done'

  console.log(`${tag} 📝 logEvent — type="${eventType}" → "${strapiEventType}" agent="${agentId || 'system'}" @ ${ts}`)
  console.log(`${tag} 📝 description: ${description.slice(0, 200)}`)
  if (metadata) console.log(`${tag} 📝 metadata: ${JSON.stringify(metadata).slice(0, 300)}`)

  if (!STRAPI_TOKEN) {
    console.log(`${tag} ⚠️ No STRAPI_TOKEN set, skipping persist`)
    return { ok: false }
  }

  const url = `${STRAPI_URL}/api/rpg-events`
  const body = {
    data: {
      eventType: strapiEventType,
      title: description.slice(0, 255),
      description,
      metadata: {
        originalType: eventType,
        agentId: agentId || 'system',
        ...(metadata || {}),
        loggedAt: ts,
      },
      happenedAt: ts,
    },
  }

  try {
    console.log(`${tag} 📤 POST ${url}`)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    console.log(`${tag} ${res.ok ? '✅' : '❌'} Status: ${res.status} Response: ${text.slice(0, 300)}`)

    if (res.ok) {
      try {
        const json = JSON.parse(text)
        return { ok: true, id: json.data?.id }
      } catch {
        return { ok: true }
      }
    }
    return { ok: false }
  } catch (err) {
    console.error(`${tag} 💥 Exception writing to Strapi:`, err)
    return { ok: false }
  }
}

// Query events from Strapi rpg-events
export async function queryEvents(params: {
  limit?: number
  type?: string
  agentId?: string
}): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const { limit = 50, type, agentId } = params
  const tag = '[STRAPI-QUERY]'
  console.log(`${tag} 🔍 Querying: limit=${limit}, type=${type || 'all'}, agentId=${agentId || 'all'}`)

  if (!STRAPI_TOKEN) {
    console.log(`${tag} ⚠️ No STRAPI_TOKEN set`)
    return { data: [], total: 0 }
  }

  const searchParams = new URLSearchParams()
  searchParams.set('pagination[pageSize]', String(limit))
  searchParams.set('sort', 'createdAt:desc')

  if (type) {
    const mapped = EVENT_TYPE_MAP[type]
    if (mapped) {
      searchParams.set('filters[eventType][$eq]', mapped)
    }
  }

  try {
    const url = `${STRAPI_URL}/api/rpg-events?${searchParams.toString()}`
    console.log(`${tag} 📤 GET ${url.slice(0, 200)}`)

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error(`${tag} ❌ Status: ${res.status}`)
      return { data: [], total: 0 }
    }

    const json = await res.json()
    let events: Record<string, unknown>[] = json.data || []

    // Client-side filter by agentId/type in metadata
    if (agentId) {
      events = events.filter((e) => {
        const meta = e.metadata as Record<string, unknown> | null
        return meta?.agentId === agentId
      })
    }
    if (type) {
      events = events.filter((e) => {
        const meta = e.metadata as Record<string, unknown> | null
        return meta?.originalType === type || (meta?.originalType as string)?.includes(type)
      })
    }

    console.log(`${tag} ✅ Found ${events.length} events`)
    return { data: events, total: json.meta?.pagination?.total || events.length }
  } catch (err) {
    console.error(`${tag} 💥 Exception:`, err)
    return { data: [], total: 0 }
  }
}
