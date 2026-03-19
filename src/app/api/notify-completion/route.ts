export async function POST(req: Request) {
  const { taskTitle, agentName, agentId, xpReward } = await req.json()
  console.log(`✅ Task completed: "${taskTitle}" by ${agentName} (+${xpReward} XP)`)
  return Response.json({
    success: true,
    message: `Task "${taskTitle}" completed by ${agentName}`,
    notification: {
      text: `✅ Задача выполнена!\n\n📋 ${taskTitle}\n👤 ${agentName}\n⭐ +${xpReward} XP`,
      agentId,
    }
  })
}
