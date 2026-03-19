import { NextResponse } from 'next/server'
import { broadcast, addActivity } from '@/lib/events'
import { logEvent } from '@/lib/strapi-logger'

export const dynamic = 'force-dynamic'

const STATUS_EMOJI: Record<string, string> = {
  received: '📨',
  started: '🏃',
  progress: '⏳',
  completed: '✅',
  failed: '❌',
}

const VALID_STATUSES = ['received', 'started', 'progress', 'completed', 'failed']

export async function POST(req: Request) {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[TASK-STATUS] 🚀 POST /api/task-status — ${new Date().toISOString()}`)

  try {
    const body = await req.json()
    const { taskId, agentId, status, message, progress } = body

    console.log(`[TASK-STATUS] 📋 taskId: ${taskId}`)
    console.log(`[TASK-STATUS] 👤 agentId: ${agentId}`)
    console.log(`[TASK-STATUS] 📊 status: ${status}`)
    console.log(`[TASK-STATUS] 💬 message: ${message}`)
    console.log(`[TASK-STATUS] 📈 progress: ${progress}`)

    // Validate required fields
    if (!taskId || !agentId || !status) {
      console.log(`[TASK-STATUS] ❌ Validation failed: taskId, agentId, and status are required`)
      return NextResponse.json(
        { error: 'taskId, agentId, and status are required' },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status)) {
      console.log(`[TASK-STATUS] ❌ Invalid status: ${status}. Valid: ${VALID_STATUSES.join(', ')}`)
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const emoji = STATUS_EMOJI[status] || '📌'
    const progressText = progress !== undefined ? ` (${progress}%)` : ''

    // Step 1: Persist to Strapi rpg-event
    const step1Start = Date.now()
    console.log(`[TASK-STATUS] ── Step 1: Strapi rpg-event ──`)
    const strapiResult = await logEvent(
      'task:status',
      `${emoji} Task ${taskId}: ${status}${progressText} — ${message || 'no message'}`,
      agentId,
      { taskId, status, message, progress },
    )
    const step1Ms = Date.now() - step1Start
    console.log(`[TASK-STATUS] Strapi: ${strapiResult.ok ? '✅' : '❌'} (${step1Ms}ms)`)

    // Step 2: Broadcast SSE event
    console.log(`[TASK-STATUS] ── Step 2: SSE broadcast ──`)
    broadcast('task-status-update', {
      taskId,
      agentId,
      status,
      message: message || '',
      progress,
      emoji,
    })
    console.log(`[TASK-STATUS] ✅ SSE broadcast sent`)

    // Step 3: Add to activity feed
    console.log(`[TASK-STATUS] ── Step 3: Activity feed ──`)
    const activityMessage = `${emoji} Task ${taskId}: ${status}${progressText} — ${message || 'no message'}`
    addActivity({
      type: 'task-status',
      message: activityMessage,
      agentId,
      taskId,
    })
    console.log(`[TASK-STATUS] ✅ Activity: ${activityMessage}`)

    const elapsed = Date.now() - startTime
    console.log(`[TASK-STATUS] ⏱️ Total: ${elapsed}ms`)
    console.log(`${'='.repeat(60)}\n`)

    return NextResponse.json({
      success: true,
      strapiPersisted: strapiResult.ok,
      status,
      taskId,
      agentId,
      pipeline: {
        'strapi-event': { ok: strapiResult.ok, ms: step1Ms },
        sse: { ok: true },
        activity: { ok: true },
      },
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`[TASK-STATUS] 💥 Unhandled error:`, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
