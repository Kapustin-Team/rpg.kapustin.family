import { NextRequest, NextResponse } from 'next/server'
import { queryEvents } from '@/lib/strapi-logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  console.log(`\n${'='.repeat(60)}`)
  console.log(`[EVENTS-LOG] 🚀 GET /api/events-log — ${new Date().toISOString()}`)

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const type = searchParams.get('type') || undefined
    const agentId = searchParams.get('agentId') || undefined

    console.log(`[EVENTS-LOG] 📋 Params: limit=${limit}, type=${type || 'all'}, agentId=${agentId || 'all'}`)

    const result = await queryEvents({ limit, type, agentId })

    const elapsed = Date.now() - startTime
    console.log(`[EVENTS-LOG] ✅ Returning ${result.data.length} events in ${elapsed}ms`)
    console.log(`${'='.repeat(60)}\n`)

    return NextResponse.json({
      events: result.data,
      total: result.total,
      elapsed: `${elapsed}ms`,
    })
  } catch (err) {
    console.error(`[EVENTS-LOG] 💥 Error:`, err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
