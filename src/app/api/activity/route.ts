import { NextResponse } from 'next/server'
import { getActivities, addActivity, broadcast } from '@/lib/events'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ activities: getActivities() })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, message, agentId, taskId } = body

    if (!type || !message) {
      return NextResponse.json({ error: 'type and message required' }, { status: 400 })
    }

    const activity = addActivity({ type, message, agentId, taskId })
    broadcast('activity', { activity })

    return NextResponse.json({ success: true, activity })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
