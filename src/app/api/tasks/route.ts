import { NextResponse } from "next/server"

export async function GET() {
  const strapiUrl = process.env.STRAPI_URL || "https://strapi.kapustin.family"
  const strapiToken = process.env.STRAPI_API_TOKEN || ""

  try {
    const headers: Record<string, string> = {}
    if (strapiToken) {
      headers.Authorization = `Bearer ${strapiToken}`
    }

    const [tasksRes, agentTasksRes] = await Promise.all([
      fetch(`${strapiUrl}/api/tasks?populate=*&pagination[limit]=50`, {
        headers,
        next: { revalidate: 60 },
      }),
      fetch(`${strapiUrl}/api/agent-tasks?populate=*&pagination[limit]=50`, {
        headers,
        next: { revalidate: 60 },
      }),
    ])

    const tasks = tasksRes.ok ? await tasksRes.json() : { data: [] }
    const agentTasks = agentTasksRes.ok ? await agentTasksRes.json() : { data: [] }

    return NextResponse.json({
      tasks: tasks.data || [],
      agentTasks: agentTasks.data || [],
    })
  } catch {
    return NextResponse.json({ tasks: DEMO_TASKS, agentTasks: [] })
  }
}

const DEMO_TASKS = [
  {
    id: 1,
    attributes: {
      title: "Deploy RPG to production",
      status: "todo",
      priority: "high",
      rpgCategory: "build",
      resourceReward: { gold: 50, knowledge: 20 },
    },
  },
  {
    id: 2,
    attributes: {
      title: "Fix Strapi env variables",
      status: "in_progress",
      priority: "critical",
      rpgCategory: "defense",
      resourceReward: { gold: 30, code: 40 },
    },
  },
  {
    id: 3,
    attributes: {
      title: "Add North Gard animations",
      status: "todo",
      priority: "medium",
      rpgCategory: "build",
      resourceReward: { knowledge: 30, creativity: 15 },
    },
  },
  {
    id: 4,
    attributes: {
      title: "Setup CI/CD for strapi repo",
      status: "done",
      priority: "high",
      rpgCategory: "build",
      resourceReward: { gold: 40, code: 25 },
    },
  },
  {
    id: 5,
    attributes: {
      title: "Analyze fitness data April",
      status: "todo",
      priority: "low",
      rpgCategory: "research",
      resourceReward: { data: 50, knowledge: 20 },
    },
  },
]
