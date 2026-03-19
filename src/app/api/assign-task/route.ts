import { NextResponse } from 'next/server'
import { broadcast, addActivity } from '@/lib/events'

export const dynamic = 'force-dynamic'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = '-1003805137798'
const TELEGRAM_TOPIC_ID = '60'
const OPENCLAW_HOOKS_URL = process.env.OPENCLAW_HOOKS_URL || ''
const OPENCLAW_HOOKS_TOKEN = process.env.OPENCLAW_HOOKS_TOKEN || ''

const AGENTS: Record<string, { name: string; emoji: string; account: string }> = {
  milena: { name: 'Milena', emoji: '🎨', account: 'main' },
  aleksandra: { name: 'Aleksandra', emoji: '💻', account: 'main-aleksandra' },
  kristina: { name: 'Kristina', emoji: '🍰', account: 'main-sladosti' },
  danijela: { name: 'Danijela', emoji: '📋', account: 'main-danijela' },
  jovana: { name: 'Jovana', emoji: '💪', account: 'main-jovana' },
}

async function sendTelegram(text: string): Promise<{ ok: boolean; status?: number; response?: string }> {
  const step = '[ASSIGN][TG]'
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`${step} ⚠️ No TELEGRAM_BOT_TOKEN, skipping`)
    return { ok: false }
  }
  try {
    console.log(`${step} 📤 Sending to chat ${TELEGRAM_CHAT_ID} topic ${TELEGRAM_TOPIC_ID}...`)
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
    const body = await res.text()
    console.log(`${step} ${res.ok ? '✅' : '❌'} Status: ${res.status}, Response: ${body.slice(0, 300)}`)
    return { ok: res.ok, status: res.status, response: body.slice(0, 300) }
  } catch (err) {
    console.error(`${step} 💥 Exception:`, err)
    return { ok: false }
  }
}

async function notifyAgent(agentId: string, message: string): Promise<{ ok: boolean; status?: number; response?: string; hookUrl?: string }> {
  const step = '[ASSIGN][HOOKS]'
  if (!OPENCLAW_HOOKS_URL) {
    console.log(`${step} ⚠️ No OPENCLAW_HOOKS_URL set`)
    return { ok: false }
  }
  if (!OPENCLAW_HOOKS_TOKEN) {
    console.log(`${step} ⚠️ No OPENCLAW_HOOKS_TOKEN set`)
    return { ok: false }
  }

  const agent = AGENTS[agentId]
  if (!agent) {
    console.log(`${step} ❌ Unknown agent: ${agentId}`)
    return { ok: false }
  }

  const hookUrl = `${OPENCLAW_HOOKS_URL}/agent`
  const payload = {
    message,
    agentId: agent.account,
    sessionKey: `hook:rpg:task:${Date.now()}`,
    deliver: true,
    channel: 'telegram',
    to: TELEGRAM_CHAT_ID,
    timeoutSeconds: 120,
  }

  try {
    console.log(`${step} 📤 Sending to ${hookUrl}`)
    console.log(`${step} 📦 Payload: agentId=${agent.account}, deliver=true, channel=telegram`)
    console.log(`${step} 📦 Message preview: ${message.slice(0, 100)}...`)

    const res = await fetch(hookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_HOOKS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })
    const body = await res.text()
    console.log(`${step} ${res.ok ? '✅' : '❌'} Status: ${res.status}`)
    console.log(`${step} 📥 Response: ${body.slice(0, 500)}`)
    return { ok: res.ok, status: res.status, response: body.slice(0, 500), hookUrl }
  } catch (err) {
    console.error(`${step} 💥 Exception:`, err)
    return { ok: false, hookUrl }
  }
}

export async function POST(req: Request) {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[ASSIGN] 🚀 POST /api/assign-task — ${new Date().toISOString()}`)

  try {
    const body = await req.json()
    const { taskTitle, agentId, xpReward, priority, category } = body
    console.log(`[ASSIGN] 📋 Task: "${taskTitle}"`)
    console.log(`[ASSIGN] 👤 Agent: ${agentId}`)
    console.log(`[ASSIGN] ⭐ XP: ${xpReward} | Priority: ${priority} | Category: ${category}`)

    const agent = AGENTS[agentId]
    if (!agent) {
      console.log(`[ASSIGN] ❌ Unknown agent: ${agentId}`)
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 })
    }
    console.log(`[ASSIGN] ✅ Agent found: ${agent.name} (${agent.emoji}) account=${agent.account}`)

    const priorityEmoji: Record<string, string> = {
      critical: '🔴', high: '🟠', medium: '🟡', low: '⚪',
    }

    // 1. Telegram
    console.log(`[ASSIGN] ── Step 1: Telegram notification ──`)
    const tgMessage = [
      `📋 <b>Новая задача назначена!</b>`,
      ``,
      `<b>${taskTitle}</b>`,
      `${agent.emoji} Исполнитель: <b>${agent.name}</b>`,
      `${priorityEmoji[priority] || '⚪'} Приоритет: ${priority}`,
      category ? `📁 Категория: ${category}` : '',
      `⭐ Награда: ${xpReward} XP`,
    ].filter(Boolean).join('\n')
    const tgResult = await sendTelegram(tgMessage)

    // 2. OpenClaw hooks
    console.log(`[ASSIGN] ── Step 2: OpenClaw hooks/agent ──`)
    console.log(`[ASSIGN] OPENCLAW_HOOKS_URL = ${OPENCLAW_HOOKS_URL ? OPENCLAW_HOOKS_URL.slice(0, 50) + '...' : '(not set)'}`)
    console.log(`[ASSIGN] OPENCLAW_HOOKS_TOKEN = ${OPENCLAW_HOOKS_TOKEN ? OPENCLAW_HOOKS_TOKEN.slice(0, 10) + '...' : '(not set)'}`)
    
    const agentMessage = [
      `📋 Новая задача из RPG City Control Panel:`,
      ``,
      `**${taskTitle}**`,
      `Приоритет: ${priority} | Категория: ${category || 'general'}`,
      `⭐ Награда: ${xpReward} XP`,
      ``,
      `Выполни задачу и отчитайся в группу AGENTS topic 60.`,
    ].join('\n')
    const hooksResult = await notifyAgent(agentId, agentMessage)

    // 3. SSE broadcast
    console.log(`[ASSIGN] ── Step 3: SSE broadcast ──`)
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

    // 4. Summary
    const elapsed = Date.now() - startTime
    console.log(`[ASSIGN] ── Summary ──`)
    console.log(`[ASSIGN] Telegram: ${tgResult.ok ? '✅' : '❌'} (${tgResult.status || 'n/a'})`)
    console.log(`[ASSIGN] OpenClaw: ${hooksResult.ok ? '✅' : '❌'} (${hooksResult.status || 'n/a'})`)
    console.log(`[ASSIGN] SSE: ✅ broadcast sent`)
    console.log(`[ASSIGN] ⏱️ Total time: ${elapsed}ms`)
    console.log(`${'='.repeat(60)}\n`)

    // Add detailed log to activity
    addActivity({
      type: 'system-log',
      message: `🔧 Assign pipeline: TG=${tgResult.ok ? '✅' : '❌'} | Hooks=${hooksResult.ok ? '✅' : '❌'} | ${elapsed}ms`,
      agentId,
    })

    return NextResponse.json({
      success: true,
      telegramSent: tgResult.ok,
      telegramStatus: tgResult.status,
      agentNotified: hooksResult.ok,
      agentNotifyStatus: hooksResult.status,
      agentNotifyResponse: hooksResult.response,
      hookUrl: hooksResult.hookUrl,
      agent: agent.name,
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`[ASSIGN] 💥 Unhandled error:`, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
