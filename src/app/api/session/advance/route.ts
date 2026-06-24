import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/store'
import type { SessionPhase } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { id, action } = await req.json() as { id: string; action: string }
  const session = getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let patch: Partial<typeof session> = {}

  if (action === 'start-question') {
    patch = { phase: 'question' as SessionPhase, questionStartedAt: Date.now(), answers: {} }
  } else if (action === 'reveal') {
    const q = session.quiz[session.currentQuestion]
    const result = {
      questionIndex: session.currentQuestion,
      questionText: q.text,
      correct: q.correct,
      answers: { ...session.answers },
    }
    patch = { phase: 'reveal' as SessionPhase, history: [...session.history, result] }
  } else if (action === 'leaderboard') {
    patch = { phase: 'leaderboard' as SessionPhase }
  } else if (action === 'next') {
    const next = session.currentQuestion + 1
    if (next >= session.quiz.length) {
      patch = { phase: 'done' as SessionPhase }
    } else {
      patch = { phase: 'question' as SessionPhase, currentQuestion: next, questionStartedAt: Date.now(), answers: {} }
    }
  } else if (action === 'cancel') {
    patch = { phase: 'cancelled' as SessionPhase }
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const updated = updateSession(id, patch)
  return NextResponse.json(updated)
}
