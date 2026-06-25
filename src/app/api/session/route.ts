import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { setSession, getSession } from '@/lib/store'
import type { Question, SessionSettings } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; quiz: Question[]; settings: SessionSettings }
  const id = Math.random().toString(36).slice(2, 8).toUpperCase()
  const hostToken = uuid()
  setSession(id, {
    id,
    name: body.name ?? 'Quiz',
    hostToken,
    quiz: body.quiz.map(q => ({ ...q, id: uuid() })),
    players: {},
    phase: 'lobby',
    currentQuestion: 0,
    questionStartedAt: null,
    answers: {},
    settings: body.settings,
    history: [],
  })
  return NextResponse.json({ id, hostToken })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const session = getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hostToken: _, ...safeSession } = session
  return NextResponse.json(safeSession)
}
