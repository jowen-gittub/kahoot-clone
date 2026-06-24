import type { Session } from './types'

// Survive hot reloads in dev by attaching to the global object
const g = global as typeof global & { __sessions?: Map<string, Session> }
if (!g.__sessions) g.__sessions = new Map<string, Session>()
const sessions = g.__sessions

export function getSession(id: string): Session | undefined {
  return sessions.get(id)
}

export function setSession(id: string, session: Session): void {
  sessions.set(id, session)
}

export function updateSession(id: string, patch: Partial<Session>): Session | null {
  const session = sessions.get(id)
  if (!session) return null
  const updated = { ...session, ...patch }
  sessions.set(id, updated)
  return updated
}
