import { Redis } from '@upstash/redis'
import type { Session } from './types'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const key = (id: string) => `session:${id}`

export async function getSession(id: string): Promise<Session | null> {
  return redis.get<Session>(key(id))
}

export async function setSession(id: string, session: Session): Promise<void> {
  // Sessions expire after 24 hours
  await redis.set(key(id), session, { ex: 86400 })
}

export async function updateSession(id: string, patch: Partial<Session>): Promise<Session | null> {
  const session = await getSession(id)
  if (!session) return null
  const updated = { ...session, ...patch }
  await setSession(id, updated)
  return updated
}
