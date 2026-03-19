import { broadcast, addActivity } from '@/lib/events'

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

    // Broadcast SSE event
    console.log(`[COMPLETE] ── Step 1: SSE broadcast ──`)
    broadcast('task-completed', {
      taskTitle,
      agentId,
      agentName,
      xpReward,
    })
    console.log(`[COMPLETE] ✅ SSE broadcast sent`)

    // Add to activity log
    console.log(`[COMPLETE] ── Step 2: Activity log ──`)
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
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`[COMPLETE] 💥 Error:`, err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
