import { broadcast, addActivity } from '@/lib/events'
import { logEvent } from '@/lib/strapi-logger'

export async function POST(req: Request) {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[COMPLETE] 🚀 POST /api/notify-completion — ${new Date().toISOString()}`)

  try {
    const body = await req.json()
    const { taskTitle, agentName, agentId, xpReward } = body
    console.log(`[COMPLETE] 📋 Task: "${taskTitle}"`)
    console.log(`[COMPLETE] 👤 Agent: ${agentName} (${agentId})`)
    console.log(`[COMPLETE] ⭐ XP reward: ${xpReward}`)

    // Step 1: Strapi rpg-event
    const step1Start = Date.now()
    console.log(`[COMPLETE] ── Step 1: Strapi rpg-event (${Date.now() - startTime}ms) ──`)
    const strapiResult = await logEvent(
      'task:completed',
      `Task "${taskTitle}" completed by ${agentName} (+${xpReward} XP)`,
      agentId,
      { taskTitle, agentName, xpReward },
    )
    const step1Ms = Date.now() - step1Start
    console.log(`[COMPLETE] ${strapiResult.ok ? '✅' : '❌'} Strapi event (${step1Ms}ms)`)

    // Step 2: SSE broadcast
    console.log(`[COMPLETE] ── Step 2: SSE broadcast (${Date.now() - startTime}ms) ──`)
    broadcast('task-completed', {
      taskTitle,
      agentId,
      agentName,
      xpReward,
    })
    console.log(`[COMPLETE] ✅ SSE broadcast sent`)

    // Step 3: Activity log
    console.log(`[COMPLETE] ── Step 3: Activity log (${Date.now() - startTime}ms) ──`)
    addActivity({
      type: 'task-completed',
      message: `✅ "${taskTitle}" completed by ${agentName} (+${xpReward} XP)`,
      agentId,
    })
    console.log(`[COMPLETE] ✅ Activity added`)

    const elapsed = Date.now() - startTime
    console.log(`[COMPLETE] ⏱️ Total time: ${elapsed}ms`)
    console.log(`${'='.repeat(60)}\n`)

    return Response.json({
      success: true,
      message: `Task "${taskTitle}" completed by ${agentName}`,
      pipeline: {
        'strapi-event': { ok: strapiResult.ok, ms: step1Ms },
        sse: { ok: true },
        activity: { ok: true },
      },
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`[COMPLETE] 💥 Error:`, err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
