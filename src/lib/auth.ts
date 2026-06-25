import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './store'

export async function validateHostToken(req: NextRequest, sessionId: string): Promise<NextResponse | null> {
  const token = req.headers.get('x-host-token')
  const session = await getSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (!token || token !== session.hostToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
