import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = '-1003805137798'
const TELEGRAM_TOPIC_ID = '60'

// Agent display info
const AGENTS: Record<string, { name: string; emoji: string }> = {
  milena: { name: 'Milena', emoji: '🎨' },
  aleksandra: { name: 'Aleksandra', emoji: '💻' },
  kristina: { name: 'Kristina', emoji: '🍰' },
  danijela: { name: 'Danijela', emoji: '📋' },
  jovana: { name: 'Jovana', emoji: '💪' },
}

async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set')
    return false
  }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      message_thread_id: parseInt(TELEGRAM_TOPIC_ID),
      text,
      parse_mode: 'HTML',
    }),
  })
  return res.ok
}

export async function POST(req: Request) {
  try {
    const { taskTitle, agentId, xpReward, priority, category } = await req.json()

    const agent = AGENTS[agentId]
    if (!agent) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 })
    }

    const priorityEmoji: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '⚪',
    }

    const message = [
      `📋 <b>Новая задача назначена!</b>`,
      ``,
      `<b>${taskTitle}</b>`,
      `${agent.emoji} Исполнитель: <b>${agent.name}</b>`,
      `${priorityEmoji[priority] || '⚪'} Приоритет: ${priority}`,
      category ? `📁 Категория: ${category}` : '',
      `⭐ Награда: ${xpReward} XP`,
      ``,
      `Задача назначена из <a href="https://rpg.kapustin.family">RPG City Control Panel</a>`,
    ].filter(Boolean).join('\n')

    const sent = await sendTelegram(message)

    return NextResponse.json({
      success: true,
      notified: sent,
      agent: agent.name,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
