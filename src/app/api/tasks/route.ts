import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://strapi.kapustin.family'
  const TOKEN = process.env.NEXT_PUBLIC_STRAPI_TOKEN || process.env.STRAPI_API_TOKEN || ''

  try {
    const res = await fetch(
      `${STRAPI_URL}/api/tasks?populate=*&pagination[limit]=100&sort=priority:desc&filters[status][$ne]=cancelled`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
        },
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: `Strapi returned ${res.status}`, data: [] },
        { status: 200 }
      )
    }

    const json = await res.json()
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json(
      { error: String(err), data: [] },
      { status: 200 }
    )
  }
}
