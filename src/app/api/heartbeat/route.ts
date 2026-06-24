import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { sessionId, playerId } = await req.json() as { sessionId: string; playerId: string }
  const session = getSession(sessionId)
  if (!session || !session.players[playerId]) return NextResponse.json({ ok: false })

  const players = {
    ...session.players,
    [playerId]: { ...session.players[playerId], lastSeen: Date.now() },
  }
  updateSession(sessionId, { players })
  return NextResponse.json({ ok: true })
}
