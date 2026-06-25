import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/store'
import { calculateScore } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const { sessionId, playerId, answer } = await req.json() as {
    sessionId: string; playerId: string; answer: string
  }
  if (!answer || answer.length > 500) {
    return NextResponse.json({ error: 'Invalid answer' }, { status: 400 })
  }
  const session = getSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.phase !== 'question') return NextResponse.json({ error: 'Not in question phase' }, { status: 400 })
  if (session.answers[playerId]) return NextResponse.json({ error: 'Already answered' }, { status: 400 })

  const now = Date.now()
  const question = session.quiz[session.currentQuestion]
  const isCorrect = answer.trim().toLowerCase() === question.correct.trim().toLowerCase()
  const points = calculateScore(session, playerId, isCorrect, now)

  const player = session.players[playerId]
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const updatedPlayer = {
    ...player,
    score: player.score + points,
    streak: isCorrect ? player.streak + 1 : 0,
  }

  const updatedAnswers = { ...session.answers, [playerId]: answer }
  const updatedPlayers = { ...session.players, [playerId]: updatedPlayer }
  const onlinePlayerIds = Object.entries(updatedPlayers)
    .filter(([, p]) => Date.now() - p.lastSeen < 15000)
    .map(([id]) => id)
  const alreadyRevealed = session.history.some(h => h.questionIndex === session.currentQuestion)
  const allAnswered = !alreadyRevealed &&
    onlinePlayerIds.length > 0 &&
    onlinePlayerIds.every(pid => updatedAnswers[pid])

  const autoRevealPatch = allAnswered ? {
    phase: 'reveal' as const,
    history: [...session.history, {
      questionIndex: session.currentQuestion,
      questionText: question.text,
      correct: question.correct,
      answers: updatedAnswers,
    }],
  } : {}

  updateSession(sessionId, {
    answers: updatedAnswers,
    players: updatedPlayers,
    ...autoRevealPatch,
  })

  return NextResponse.json({ isCorrect, points })
}
