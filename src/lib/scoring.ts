import type { Session } from './types'

const BASE_POINTS = 1000
const MAX_SPEED_BONUS = 500
const STREAK_BONUS = 200

export function calculateScore(
  session: Session,
  playerId: string,
  isCorrect: boolean,
  answeredAt: number
): number {
  if (!isCorrect) return 0

  let points = BASE_POINTS

  if (session.settings.speedPoints && session.questionStartedAt) {
    const question = session.quiz[session.currentQuestion]
    const elapsed = (answeredAt - session.questionStartedAt) / 1000
    const ratio = Math.max(0, 1 - elapsed / question.timeLimit)
    points += Math.round(MAX_SPEED_BONUS * ratio)
  }

  if (session.settings.streaks) {
    const streak = session.players[playerId]?.streak ?? 0
    if (streak > 0) points += STREAK_BONUS
  }

  return points
}
