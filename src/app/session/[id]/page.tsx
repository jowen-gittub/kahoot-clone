'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import type { Session } from '@/lib/types'

function useSession(id: string) {
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

async function advance(id: string, action: string) {
  await fetch('/api/session/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action }),
  })
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const { session, refresh } = useSession(id)
  const [playUrl, setPlayUrl] = useState('')

  useEffect(() => {
    setPlayUrl(`${window.location.origin}/play/${id}`)
  }, [id])

  useEffect(() => {
    if (session?.phase === 'done') {
      localStorage.removeItem('kahootklone-active-session')
    }
  }, [session?.phase])

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--w-navy)' }}>
      <p className="text-white opacity-60">Loading…</p>
    </div>
  )

  const question = session.quiz[session.currentQuestion]
  const answeredCount = Object.keys(session.answers).length
  const playerCount = Object.keys(session.players).length
  const onlineCount = Object.values(session.players).filter(p => Date.now() - p.lastSeen < 15000).length
  const sortedPlayers = Object.entries(session.players).sort(([, a], [, b]) => b.score - a.score)

  async function act(action: string) {
    await advance(id, action)
    refresh()
  }

  const phaseBadge: Record<string, { label: string; bg: string }> = {
    lobby:       { label: 'Lobby',       bg: 'var(--w-gray-400)' },
    question:    { label: 'Live',        bg: 'var(--w-orange)' },
    reveal:      { label: 'Reveal',      bg: '#22c55e' },
    leaderboard: { label: 'Leaderboard', bg: 'var(--w-navy-light)' },
    done:        { label: 'Done',        bg: 'var(--w-gray-400)' },
  }
  const badge = phaseBadge[session.phase]

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--w-navy)' }}>
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-6 rounded-full" style={{ background: 'var(--w-orange)' }} />
              <h1 className="text-xl font-bold text-white">Host Panel</h1>
            </div>
            <div className="flex items-center gap-3 pl-3">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Session <span className="font-mono">{id}</span>
              </p>
              <a href="/admin" className="text-xs hover:underline" style={{ color: 'rgba(255,255,255,0.4)' }}>← Admin</a>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white uppercase tracking-wide"
            style={{ background: badge.bg }}>
            {badge.label}
          </span>
        </div>

        {/* Lobby */}
        {session.phase === 'lobby' && (
          <div className="rounded-lg p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {/* QR code + join info */}
            <div className="flex gap-4 items-start">
              {playUrl && (
                <div className="shrink-0 space-y-1">
                  <div className="p-2 rounded-lg" style={{ background: 'white' }}>
                    <QRCodeSVG value={playUrl} size={96} />
                  </div>
                  {playUrl.includes('localhost') && (
                    <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>⚠ localhost only</p>
                  )}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Session code</p>
                  <p className="text-3xl font-bold tracking-widest text-white">{id}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>Join at</p>
                  {[
                    { label: 'Direct', url: playUrl || '/play/' + id },
                    { label: 'Lobby', url: playUrl ? new URL(playUrl).origin + '/join' : '/join' },
                  ].map(({ label, url }) => (
                    <div key={label} className="flex items-center gap-2">
                      <code className="text-xs flex-1 break-all" style={{ color: 'rgba(255,255,255,0.7)' }}>{url}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(url)}
                        className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded"
                        style={{ background: 'var(--w-orange)', color: 'white' }}
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Players joined ({onlineCount} online{playerCount !== onlineCount ? `, ${playerCount - onlineCount} offline` : ''})
              </p>
              {playerCount > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.values(session.players).map(p => {
                    const online = Date.now() - p.lastSeen < 15000
                    return (
                      <span key={p.name} className="text-sm px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{ background: 'rgba(255,255,255,0.12)', color: online ? 'white' : 'rgba(255,255,255,0.35)' }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: online ? '#22c55e' : 'rgba(255,255,255,0.25)' }} />
                        {p.name}
                      </span>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Waiting for players…</p>
              )}
            </div>

            <button
              onClick={() => act('start-question')}
              disabled={playerCount === 0}
              className="w-full py-3 rounded font-semibold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'var(--w-orange)' }}
            >
              Begin quiz · {session.quiz.length} question{session.quiz.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Question / Reveal */}
        {(session.phase === 'question' || session.phase === 'reveal') && (
          <div className="rounded-lg p-5 space-y-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Question {session.currentQuestion + 1} / {session.quiz.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--w-orange)' }}>
                {question.type}
              </span>
            </div>

            <p className="text-lg font-semibold text-white leading-snug">{question.text}</p>

            {question.options && (
              <div className="grid grid-cols-2 gap-2">
                {question.options.map(opt => (
                  <div
                    key={opt}
                    className="rounded px-3 py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: session.phase === 'reveal'
                        ? opt === question.correct ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.08)',
                      color: session.phase === 'reveal'
                        ? opt === question.correct ? '#86efac' : 'rgba(255,255,255,0.35)'
                        : 'white',
                      border: session.phase === 'reveal' && opt === question.correct
                        ? '1px solid rgba(34,197,94,0.5)' : '1px solid transparent',
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {session.phase === 'reveal' && (
              <p className="text-sm" style={{ color: '#86efac' }}>
                Correct: <strong>{question.correct}</strong>
              </p>
            )}

            {/* Answer progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>{answeredCount} / {playerCount} answered</span>
                <span>{playerCount ? Math.round((answeredCount / playerCount) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: playerCount ? `${(answeredCount / playerCount) * 100}%` : '0%',
                    background: 'var(--w-orange)',
                  }}
                />
              </div>
            </div>

            {session.phase === 'question' && (
              <button onClick={() => act('reveal')}
                className="w-full py-2.5 rounded font-semibold text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.12)' }}>
                Reveal answer
              </button>
            )}
            {session.phase === 'reveal' && (
              <button onClick={() => act('leaderboard')}
                className="w-full py-2.5 rounded font-semibold text-white transition-colors"
                style={{ background: 'var(--w-orange)' }}>
                Show leaderboard
              </button>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {(session.phase === 'leaderboard' || session.phase === 'done') && (
          <div className="rounded-lg p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {session.phase === 'done' ? 'Final scores' : 'Leaderboard'}
            </h2>
            <div className="space-y-2">
              {sortedPlayers.map(([, p], i) => (
                <div key={p.name} className="flex items-center gap-3 rounded px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-sm w-5 text-center font-bold"
                    style={{ color: i === 0 ? 'var(--w-orange)' : 'rgba(255,255,255,0.4)' }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-white font-medium">{p.name}</span>
                  {session.settings.streaks && p.streak > 1 && (
                    <span className="text-xs" style={{ color: 'var(--w-orange)' }}>🔥 {p.streak}</span>
                  )}
                  <span className="font-bold text-white">{p.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
            {session.phase === 'leaderboard' && (
              <button onClick={() => act('next')}
                className="w-full py-2.5 rounded font-semibold text-white mt-2"
                style={{ background: 'var(--w-orange)' }}>
                {session.currentQuestion + 1 < session.quiz.length ? 'Next question' : 'Finish quiz'}
              </button>
            )}
            {session.phase === 'done' && (
              <a
                href={`/api/export/${id}`}
                download
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded font-semibold text-white mt-2"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                ↓ Export results (.xlsx)
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
