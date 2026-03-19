import { subscribe, unsubscribe, type SSEEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': connected\n\n'))

      const onEvent = (event: SSEEvent) => {
        try {
          const data = JSON.stringify({ ...event.data, timestamp: event.timestamp })
          controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`))
        } catch {
          // client disconnected
        }
      }

      subscribe(onEvent)

      // Keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
          unsubscribe(onEvent)
        }
      }, 30000)

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(keepalive)
        unsubscribe(onEvent)
      }

      // Store cleanup for cancel
      ;(controller as unknown as Record<string, () => void>)._cleanup = cleanup
    },
    cancel() {
      // Called when client disconnects
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
