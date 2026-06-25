import { useState, useEffect, useCallback } from 'react'
import type { Session } from './types'

export function useSession(id: string) {
  const [session, setSession] = useState<Session | null>(null)

  const poll = useCallback(async () => {
    const res = await fetch(`/api/poll/${id}`)
    if (res.ok) setSession(await res.json())
  }, [id])

  useEffect(() => {
    poll()
    const interval = setInterval(poll, 1500)
    return () => clearInterval(interval)
  }, [poll])

  return { session, refresh: poll }
}
