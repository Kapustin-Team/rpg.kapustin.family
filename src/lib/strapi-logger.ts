// Centralized Strapi event logger — writes to rpg-events collection

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.NEXT_PUBLIC_STRAPI_TOKEN || ''

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

  console.log(`${tag} 📝 logEvent — type="${eventType}" agent="${agentId || 'system'}" @ ${ts}`)
  console.log(`${tag} 📝 description: ${description.slice(0, 200)}`)
  if (metadata) console.log(`${tag} 📝 metadata: ${JSON.stringify(metadata).slice(0, 300)}`)

  if (!STRAPI_TOKEN) {
    console.log(`${tag} ⚠️ No STRAPI_TOKEN set, skipping persist`)
    return { ok: false }
  }

  const url = `${STRAPI_URL}/api/rpg-events`
  const body = {
    data: {
      eventType,
      description,
      agentId: agentId || 'system',
      metadata: metadata ? JSON.stringify(metadata) : '{}',
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
