import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './store'

export function validateHostToken(req: NextRequest, sessionId: string): NextResponse | null {
  const token = req.headers.get('x-host-token')
  const session = getSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (!token || token !== session.hostToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
