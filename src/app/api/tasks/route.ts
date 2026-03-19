import { NextResponse } from 'next/server'

const DEMO_TASKS = [
  {
    id: 1,
    attributes: {
      title: 'Deploy Next.js 15 to production',
      status: 'todo',
      priority: 'critical',
      rpgCategory: 'devops',
      resourceReward: { code: 50, data: 30 },
    },
  },
  {
    id: 2,
    attributes: {
      title: 'Build responsive dashboard UI',
      status: 'in_progress',
      priority: 'high',
      rpgCategory: 'frontend',
      resourceReward: { code: 40, creativity: 20 },
    },
  },
  {
    id: 3,
    attributes: {
      title: 'Optimize PostgreSQL queries',
      status: 'todo',
      priority: 'high',
      rpgCategory: 'backend',
      resourceReward: { data: 60, code: 20 },
    },
  },
  {
    id: 4,
    attributes: {
      title: 'Write blog post about AI agents',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'content',
      resourceReward: { creativity: 40, knowledge: 30 },
    },
  },
  {
    id: 5,
    attributes: {
      title: 'Set up health monitoring dashboard',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'health',
      resourceReward: { data: 25, knowledge: 15 },
    },
  },
  {
    id: 6,
    attributes: {
      title: 'Research vector database solutions',
      status: 'todo',
      priority: 'high',
      rpgCategory: 'research',
      resourceReward: { knowledge: 50, data: 40 },
    },
  },
  {
    id: 7,
    attributes: {
      title: 'Implement Strapi webhook handlers',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'backend',
      resourceReward: { code: 35, data: 20 },
    },
  },
  {
    id: 8,
    attributes: {
      title: 'Design new landing page mockups',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'frontend',
      resourceReward: { creativity: 45, code: 15 },
    },
  },
  {
    id: 9,
    attributes: {
      title: 'Configure Docker CI/CD pipeline',
      status: 'todo',
      priority: 'high',
      rpgCategory: 'devops',
      resourceReward: { code: 30, data: 25 },
    },
  },
  {
    id: 10,
    attributes: {
      title: 'Create social media content calendar',
      status: 'todo',
      priority: 'low',
      rpgCategory: 'content',
      resourceReward: { creativity: 30, knowledge: 10 },
    },
  },
  {
    id: 11,
    attributes: {
      title: 'Analyze sleep pattern data',
      status: 'todo',
      priority: 'low',
      rpgCategory: 'health',
      resourceReward: { knowledge: 20, data: 15 },
    },
  },
  {
    id: 12,
    attributes: {
      title: 'Build Three.js RPG city scene',
      status: 'in_progress',
      priority: 'critical',
      rpgCategory: 'frontend',
      resourceReward: { code: 60, creativity: 40 },
    },
  },
  {
    id: 13,
    attributes: {
      title: 'Set up Coolify auto-deploy',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'devops',
      resourceReward: { code: 25, data: 20 },
    },
  },
  {
    id: 14,
    attributes: {
      title: 'Organize Obsidian knowledge vault',
      status: 'todo',
      priority: 'medium',
      rpgCategory: 'research',
      resourceReward: { knowledge: 40, creativity: 10 },
    },
  },
  {
    id: 15,
    attributes: {
      title: 'Create fitness tracking API integration',
      status: 'todo',
      priority: 'high',
      rpgCategory: 'health',
      resourceReward: { code: 35, data: 30, knowledge: 15 },
    },
  },
]

export async function GET() {
  return NextResponse.json({ tasks: DEMO_TASKS })
}
