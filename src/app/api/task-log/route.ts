import { NextResponse } from 'next/server'
import { broadcast, addActivity } from '@/lib/events'
import { logEvent } from '@/lib/strapi-logger'

export const dynamic = 'force-dynamic'

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.NEXT_PUBLIC_STRAPI_TOKEN || ''

type TaskStage = 'received' | 'started' | 'progress' | 'completed' | 'failed'

const STAGE_SSE_MAP: Record<TaskStage, string> = {
  received: 'task-received',
  started: 'task-started',
  progress: 'task-progress',
  completed: 'task-completed',
  failed: 'task-failed',
}

const STAGE_EMOJI: Record<TaskStage, string> = {
  received: '📥',
  started: '🔨',
  progress: '⏳',
  completed: '✅',
  failed: '❌',
}

const STAGE_STRAPI_STATUS: Partial<Record<TaskStage, string>> = {
  started: 'in_progress',
  completed: 'done',
}

async function updateTaskStatus(taskId: string, status: string): Promise<boolean> {
  const tag = '[PIPELINE][STRAPI-TASK]'
  if (!STRAPI_TOKEN) {
    console.log(`${tag} ⚠️ No token, skipping task status update`)
    return false
  }

  // taskId might be a documentId — try updating via our own API first
  const url = `${STRAPI_URL}/api/tasks/${taskId}`
  try {
    console.log(`${tag} 📤 PUT ${url} → status=${status}`)
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ data: { status } }),
    })
    const text = await res.text()
    console.log(`${tag} ${res.ok ? '✅' : '❌'} Status: ${res.status} Response: ${text.slice(0, 200)}`)
    return res.ok
  } catch (err) {
    console.error(`${tag} 💥 Exception:`, err)
    return false
  }
}

export async function POST(req: Request) {
  const pipelineStart = Date.now()
  const ts = new Date().toISOString()
  const tag = '[PIPELINE]'

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${tag} 🚀 POST /api/task-log — ${ts}`)

  try {
    const body = await req.json()
    const { taskId, agentId, stage, message, metadata } = body as {
      taskId: string
      agentId: string
      stage: TaskStage
      message?: string
      metadata?: Record<string, unknown>
    }

    if (!taskId || !agentId || !stage) {
      console.log(`${tag} ❌ Missing required fields: taskId=${taskId} agentId=${agentId} stage=${stage}`)
      return NextResponse.json({ error: 'taskId, agentId, and stage are required' }, { status: 400 })
    }

    if (!STAGE_SSE_MAP[stage]) {
      console.log(`${tag} ❌ Invalid stage: ${stage}`)
      return NextResponse.json({ error: `Invalid stage: ${stage}. Valid: received, started, progress, completed, failed` }, { status: 400 })
    }

    const emoji = STAGE_EMOJI[stage]
    const description = message || `Task ${stage} by ${agentId}`

    console.log(`${tag} 📋 taskId=${taskId} agentId=${agentId} stage=${stage}`)
    console.log(`${tag} 📋 message: ${description}`)
    if (metadata) console.log(`${tag} 📋 metadata: ${JSON.stringify(metadata).slice(0, 300)}`)

    const results: Record<string, { ok: boolean; ms: number }> = {}

    // Step 1: Write to Strapi rpg-events
    const step1Start = Date.now()
    console.log(`${tag} ── Step 1: Strapi rpg-event (${Date.now() - pipelineStart}ms) ──`)
    const strapiResult = await logEvent(
      `task:${stage}`,
      description,
      agentId,
      { taskId, stage, message, ...metadata },
    )
    results['strapi-event'] = { ok: strapiResult.ok, ms: Date.now() - step1Start }

    // Step 2: Update task status in Strapi if applicable
    const strapiStatus = STAGE_STRAPI_STATUS[stage]
    if (strapiStatus) {
      const step2Start = Date.now()
      console.log(`${tag} ── Step 2: Update task status → ${strapiStatus} (${Date.now() - pipelineStart}ms) ──`)
      const statusOk = await updateTaskStatus(taskId, strapiStatus)
      results['strapi-task-update'] = { ok: statusOk, ms: Date.now() - step2Start }
    }

    // Step 3: SSE broadcast
    const step3Start = Date.now()
    const sseType = STAGE_SSE_MAP[stage]
    console.log(`${tag} ── Step 3: SSE broadcast "${sseType}" (${Date.now() - pipelineStart}ms) ──`)
    broadcast(sseType, {
      taskId,
      agentId,
      stage,
      message: description,
      metadata,
    })
    results['sse'] = { ok: true, ms: Date.now() - step3Start }

    // Step 4: Activity log
    const step4Start = Date.now()
    console.log(`${tag} ── Step 4: Activity log (${Date.now() - pipelineStart}ms) ──`)
    addActivity({
      type: `task-${stage}`,
      message: `${emoji} [${stage.toUpperCase()}] ${description}`,
      agentId,
      taskId,
    })
    results['activity'] = { ok: true, ms: Date.now() - step4Start }

    // Summary
    const elapsed = Date.now() - pipelineStart
    console.log(`${tag} ── Summary ──`)
    for (const [step, r] of Object.entries(results)) {
      console.log(`${tag} ${r.ok ? '✅' : '❌'} ${step}: ${r.ms}ms`)
    }
    console.log(`${tag} ⏱️ Total pipeline time: ${elapsed}ms`)
    console.log(`${'═'.repeat(60)}\n`)

    return NextResponse.json({
      success: true,
      taskId,
      agentId,
      stage,
      pipeline: results,
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`${tag} 💥 Unhandled error:`, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
