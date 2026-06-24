import { NextRequest, NextResponse } from 'next/server'
import { getSession, updateSession } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { sessionId, playerId } = await req.json() as { sessionId: string; playerId: string }
  const session = getSession(sessionId)
  if (!session) return NextResponse.json({ ok: false })

  const players = { ...session.players }
  delete players[playerId]
  updateSession(sessionId, { players })
  return NextResponse.json({ ok: true })
}
