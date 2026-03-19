import { subscribe, unsubscribe, type SSEEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  console.log(`[SSE] 🔌 New SSE client connected — ${new Date().toISOString()}`)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(': connected\n\n'))

      const onEvent = (event: SSEEvent) => {
        try {
          const data = JSON.stringify({ ...event.data, timestamp: event.timestamp })
          console.log(`[SSE] 📡 Sending event "${event.type}" to client: ${data.slice(0, 200)}`)
          controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`))
        } catch (err) {
          console.log(`[SSE] ⚠️ Failed to send to client (probably disconnected):`, err)
        }
      }

      subscribe(onEvent)

      // Keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          console.log(`[SSE] 🔴 Client disconnected (keepalive failed)`)
          clearInterval(keepalive)
          unsubscribe(onEvent)
        }
      }, 30000)

      ;(controller as unknown as Record<string, () => void>)._cleanup = () => {
        console.log(`[SSE] 🔴 Client cleanup called`)
        clearInterval(keepalive)
        unsubscribe(onEvent)
      }
    },
    cancel() {
      console.log(`[SSE] 🔴 Stream cancelled`)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
