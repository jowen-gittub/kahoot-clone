'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleJoin() {
    const id = code.trim().toUpperCase()
    if (!id) { setError('Enter a session code.'); return }
    setChecking(true)
    setError('')
    const res = await fetch(`/api/poll/${id}`)
    if (!res.ok) { setError('Session not found. Check the code and try again.'); setChecking(false); return }
    const session = await res.json()
    if (session.phase !== 'lobby') { setError('This session has already started.'); setChecking(false); return }
    router.push(`/play/${id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--w-navy)' }}>
      <div className="bg-white rounded-lg p-8 w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-6 rounded-full" style={{ background: 'var(--w-orange)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--w-navy)' }}>Join a quiz</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--w-gray-400)' }}>Enter the session code shown on the host's screen.</p>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          placeholder="e.g. ABC123"
          maxLength={6}
          className="w-full rounded px-4 py-3 text-2xl font-bold text-center tracking-widest focus:outline-none uppercase"
          style={{ border: '2px solid var(--w-gray-100)', color: 'var(--w-navy)' }}
          autoFocus
        />
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={checking}
          className="w-full py-3 rounded font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: 'var(--w-orange)' }}
        >
          {checking ? 'Checking…' : 'Join'}
        </button>
      </div>
    </div>
  )
}
