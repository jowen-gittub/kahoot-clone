import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/store'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let session = getSession(id)
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auto-reveal when time runs out (guard against duplicates)
  const alreadyRevealed = session.history.some(h => h.questionIndex === session!.currentQuestion)
  if (
    !alreadyRevealed &&
    session.phase === 'question' &&
    session.questionStartedAt !== null &&
    Date.now() - session.questionStartedAt >= session.quiz[session.currentQuestion].timeLimit * 1000
  ) {
    const q = session.quiz[session.currentQuestion]
    const updated = updateSession(id, {
      phase: 'reveal',
      history: [...session.history, {
        questionIndex: session.currentQuestion,
        questionText: q.text,
        correct: q.correct,
        answers: { ...session.answers },
      }],
    })
    if (updated) session = updated
  }

  // Never expose the host token to clients
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hostToken: _, ...safeSession } = session
  return NextResponse.json(safeSession)
}
