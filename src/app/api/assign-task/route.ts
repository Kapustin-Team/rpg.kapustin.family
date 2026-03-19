import { NextResponse } from 'next/server'
import { broadcast, addActivity } from '@/lib/events'

export const dynamic = 'force-dynamic'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = '-1003805137798'
const TELEGRAM_TOPIC_ID = '60'
const OPENCLAW_HOOKS_URL = process.env.OPENCLAW_HOOKS_URL || ''
const OPENCLAW_HOOKS_TOKEN = process.env.OPENCLAW_HOOKS_TOKEN || ''

// Agent info
const AGENTS: Record<string, { name: string; emoji: string; account: string }> = {
  milena: { name: 'Milena', emoji: '🎨', account: 'main' },
  aleksandra: { name: 'Aleksandra', emoji: '💻', account: 'main-aleksandra' },
  kristina: { name: 'Kristina', emoji: '🍰', account: 'main-sladosti' },
  danijela: { name: 'Danijela', emoji: '📋', account: 'main-danijela' },
  jovana: { name: 'Jovana', emoji: '💪', account: 'main-jovana' },
}

// Visual notification for Dima in Telegram group
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

// Send task directly to agent session via OpenClaw hooks/agent
async function notifyAgent(agentId: string, message: string) {
  if (!OPENCLAW_HOOKS_URL || !OPENCLAW_HOOKS_TOKEN) {
    console.error('OpenClaw hooks not configured')
    return false
  }
  try {
    const agent = AGENTS[agentId]
    if (!agent) return false

    const res = await fetch(`${OPENCLAW_HOOKS_URL}/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_HOOKS_TOKEN}`,
      },
      body: JSON.stringify({
        message,
        agentId: agent.account,
        sessionKey: `hook:rpg:task:${Date.now()}`,
        deliver: true,
        channel: 'telegram',
        to: TELEGRAM_CHAT_ID,
        timeoutSeconds: 120,
      }),
    })
    console.log(`OpenClaw hooks/agent response: ${res.status}`)
    return res.ok
  } catch (err) {
    console.error('OpenClaw notify failed:', err)
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

    // 1. Telegram bot → group (visual for Dima)
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

    // 2. OpenClaw hooks/agent → agent session (actual task delivery)
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

    // 3. Broadcast SSE event + add activity
    broadcast('task-assigned', {
      taskTitle,
      agentId,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      xpReward,
      priority,
    })
    addActivity({
      type: 'task-assigned',
      message: `📋 Task "${taskTitle}" → ${agent.emoji} ${agent.name}`,
      agentId,
    })

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
