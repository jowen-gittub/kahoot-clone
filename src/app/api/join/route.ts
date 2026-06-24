import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getSession, updateSession } from '@/lib/store'

export async function POST(req: NextRequest) {
  const { sessionId, name, team } = await req.json() as { sessionId: string; name: string; team?: string }
  const session = getSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.phase !== 'lobby') return NextResponse.json({ error: 'Session already started' }, { status: 400 })

  const nameTaken = Object.values(session.players).some(p => p.name.toLowerCase() === name.trim().toLowerCase())
  if (nameTaken) return NextResponse.json({ error: 'Name already taken — choose another' }, { status: 400 })

  const playerId = uuid()
  const players = { ...session.players, [playerId]: { name, score: 0, streak: 0, team, lastSeen: Date.now() } }
  updateSession(sessionId, { players })
  return NextResponse.json({ playerId })
}
