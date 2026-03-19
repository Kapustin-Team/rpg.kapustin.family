import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Agent session keys for OpenClaw
const AGENT_SESSIONS: Record<string, { sessionKey: string; account: string; name: string }> = {
  milena: { sessionKey: 'agent:main:main', account: 'main', name: 'Milena Markovic' },
  aleksandra: { sessionKey: 'agent:main-aleksandra:main', account: 'main-aleksandra', name: 'Aleksandra Avramovic' },
  kristina: { sessionKey: 'agent:main-sladosti:main', account: 'main-sladosti', name: 'Kristina Kovac' },
  danijela: { sessionKey: 'agent:main-danijela:main', account: 'main-danijela', name: 'Danijela Dragic' },
  jovana: { sessionKey: 'agent:main-jovana:main', account: 'main-jovana', name: 'Jovana Jovanovic' },
}

export async function POST(req: Request) {
  try {
    const { taskTitle, taskDescription, agentId, xpReward, priority, category } = await req.json()

    const agent = AGENT_SESSIONS[agentId]
    if (!agent) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 })
    }

    // Log the assignment
    console.log(`🎯 Task assigned: "${taskTitle}" → ${agent.name} (+${xpReward} XP)`)

    // Return the notification payload for the frontend to display
    // The actual agent notification happens through OpenClaw sessions
    return NextResponse.json({
      success: true,
      agent: agent.name,
      agentAccount: agent.account,
      sessionKey: agent.sessionKey,
      message: `📋 Новая задача из RPG City:\n\n**${taskTitle}**\n${taskDescription || ''}\n⭐ ${xpReward} XP | ${priority} | ${category}\n\nОтветь в группу AGENTS topic 60 когда выполнишь.`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
