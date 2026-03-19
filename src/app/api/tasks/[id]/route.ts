import { NextRequest } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'https://strapi.kapustin.family'
  const TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN

  const res = await fetch(`${STRAPI_URL}/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ data: body }),
  })

  const data = await res.json()
  return Response.json(data)
}
