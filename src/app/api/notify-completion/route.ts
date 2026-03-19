import { broadcast, addActivity } from '@/lib/events'

export async function POST(req: Request) {
  const { taskTitle, agentName, agentId, xpReward } = await req.json()
  console.log(`✅ Task completed: "${taskTitle}" by ${agentName} (+${xpReward} XP)`)

  // Broadcast SSE event + add activity
  broadcast('task-completed', {
    taskTitle,
    agentId,
    agentName,
    xpReward,
  })
  addActivity({
    type: 'task-completed',
    message: `✅ "${taskTitle}" completed by ${agentName} (+${xpReward} XP)`,
    agentId,
  })

  return Response.json({
    success: true,
    message: `Task "${taskTitle}" completed by ${agentName}`,
    notification: {
      text: `✅ Задача выполнена!\n\n📋 ${taskTitle}\n👤 ${agentName}\n⭐ +${xpReward} XP`,
      agentId,
    }
  })
}
