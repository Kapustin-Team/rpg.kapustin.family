import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = '-1003805137798'
const TELEGRAM_TOPIC_ID = '60'
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.kpstn.ru/webhook/rpg-assign-task'

// Agent info
const AGENTS: Record<string, { name: string; emoji: string; account: string }> = {
  milena: { name: 'Milena', emoji: '🎨', account: 'main' },
  aleksandra: { name: 'Aleksandra', emoji: '💻', account: 'main-aleksandra' },
  kristina: { name: 'Kristina', emoji: '🍰', account: 'main-sladosti' },
  danijela: { name: 'Danijela', emoji: '📋', account: 'main-danijela' },
  jovana: { name: 'Jovana', emoji: '💪', account: 'main-jovana' },
}

// Send Telegram notification (visual, for humans)
async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN) return false
  try {
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
  } catch { return false }
}

// Send task to agent session via n8n → OpenClaw hooks
async function notifyAgent(agentId: string, message: string) {
  try {
    const agent = AGENTS[agentId]
    if (!agent) return false

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        agentId: agent.account,
      }),
    })
    console.log(`n8n webhook response: ${res.status}`)
    return res.ok
  } catch (err) {
    console.error('n8n notify failed:', err)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { taskTitle, agentId, xpReward, priority, category } = await req.json()

    const agent = AGENTS[agentId]
    if (!agent) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 })
    }

    const priorityEmoji: Record<string, string> = {
      critical: '🔴', high: '🟠', medium: '🟡', low: '⚪',
    }

    // 1. Telegram bot notification (visual for Dima)
    const tgMessage = [
      `📋 <b>Новая задача назначена!</b>`,
      ``,
      `<b>${taskTitle}</b>`,
      `${agent.emoji} Исполнитель: <b>${agent.name}</b>`,
      `${priorityEmoji[priority] || '⚪'} Приоритет: ${priority}`,
      category ? `📁 Категория: ${category}` : '',
      `⭐ Награда: ${xpReward} XP`,
    ].filter(Boolean).join('\n')
    const tgSent = await sendTelegram(tgMessage)

    // 2. Agent session via n8n → OpenClaw hooks/agent
    const agentMessage = [
      `📋 Новая задача из RPG City Control Panel:`,
      ``,
      `**${taskTitle}**`,
      `Приоритет: ${priority} | Категория: ${category || 'general'}`,
      `⭐ Награда: ${xpReward} XP`,
      ``,
      `Выполни задачу и отчитайся в группу AGENTS topic 60.`,
    ].join('\n')
    const agentNotified = await notifyAgent(agentId, agentMessage)

    return NextResponse.json({
      success: true,
      telegramSent: tgSent,
      agentNotified,
      agent: agent.name,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
