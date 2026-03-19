import { NextRequest } from 'next/server'
import { broadcast, addActivity } from '@/lib/events'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[TASK-UPDATE] 🚀 PUT /api/tasks/${id} — ${new Date().toISOString()}`)

  try {
    const body = await req.json()
    console.log(`[TASK-UPDATE] 📦 Body:`, JSON.stringify(body))

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
    const TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN

    console.log(`[TASK-UPDATE] ── Step 1: Update Strapi ──`)
    console.log(`[TASK-UPDATE] 📤 PUT ${STRAPI_URL}/api/tasks/${id}`)
    console.log(`[TASK-UPDATE] 🔑 Token: ${TOKEN ? TOKEN.slice(0, 10) + '...' : '(not set)'}`)

    const res = await fetch(`${STRAPI_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
      body: JSON.stringify({ data: body }),
    })

    const data = await res.json()
    console.log(`[TASK-UPDATE] ${res.ok ? '✅' : '❌'} Strapi status: ${res.status}`)
    console.log(`[TASK-UPDATE] 📥 Response: ${JSON.stringify(data).slice(0, 300)}`)

    // Broadcast task update
    console.log(`[TASK-UPDATE] ── Step 2: SSE broadcast ──`)
    broadcast('task-updated', {
      taskId: id,
      status: body.status,
      strapiOk: res.ok,
    })
    addActivity({
      type: 'task-updated',
      message: `🔄 Task ${id} → ${body.status || 'modified'} (Strapi: ${res.ok ? '✅' : '❌'})`,
      taskId: id,
    })

    const elapsed = Date.now() - startTime
    console.log(`[TASK-UPDATE] ⏱️ Total time: ${elapsed}ms`)
    console.log(`${'='.repeat(60)}\n`)

    return Response.json({ ...data, elapsed: `${elapsed}ms` })
  } catch (err) {
    console.error(`[TASK-UPDATE] 💥 Error:`, err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
