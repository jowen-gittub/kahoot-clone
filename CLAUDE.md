# KahootKlone

A Kahoot-like live quiz app built for internal workshops at Wärtsilä. Hosts upload questions, players join via a shared link, and results are exported to Excel.

## Stack

- **Framework**: Next.js 16 (App Router, webpack — Turbopack disabled due to crashes)
- **Styling**: Tailwind v4 + CSS variables (Wärtsilä brand: navy `#003057`, orange `#FF5000`)
- **Storage**: Upstash Redis (KV) via `@upstash/redis` — sessions expire after 24h
- **Auth**: Cookie-based admin login (`ADMIN_PASSWORD` env var, 8-hour cookie)
- **Deploy**: Vercel (auto-deploys from `master` branch of `jowen-gittub/kahoot-klone`)

## Key env vars

| Var | Where set | Purpose |
|-----|-----------|---------|
| `ADMIN_PASSWORD` | Vercel + `.env.local` | Admin page login |
| `UPSTASH_REDIS_REST_URL` | Vercel (auto from Upstash) + `.env.local` | Redis connection |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel (auto from Upstash) + `.env.local` | Redis auth |

## Project structure

```
src/
  app/
    page.tsx              # Landing page (interactive fake quiz demo)
    admin/
      page.tsx            # Quiz editor (upload CSV/Excel or manual entry)
      login/page.tsx      # Password login page
    session/[id]/page.tsx # Host control panel
    play/[id]/page.tsx    # Player view
    join/page.tsx         # Enter session code manually
    api/
      auth/               # Login/logout
      session/            # Create session, GET session
      session/advance/    # Host advances phase (start-question, reveal, next, cancel)
      join/               # Player joins session
      answer/             # Player submits answer
      heartbeat/          # Player keepalive (15s offline = considered disconnected)
      leave/              # Player leaves voluntarily
      poll/[id]/          # Polling endpoint (1.5s interval) — also fires timer auto-reveal
      export/[id]/        # Excel export of results
  lib/
    types.ts              # Question, Session, Player, etc.
    store.ts              # Redis get/set/update (all async)
    auth.ts               # validateHostToken (async)
    useSession.ts         # Shared polling hook for host and player pages
    scoring.ts            # Points calculation (base + speed bonus + streak bonus)
    draftStore.ts         # localStorage quiz draft management
```

## Architecture notes

- **Session lifecycle**: `lobby` → `question` → `reveal` → `leaderboard` → (repeat) → `done` | `cancelled`
- **Real-time**: polling every 1.5s via `/api/poll/[id]`
- **Auto-reveal**: fires in poll when timer expires, and in answer route when all online players have answered
- **Host token**: UUID generated at session creation, stored in localStorage, required as `x-host-token` header for all host-only actions. Never returned in poll responses.
- **Player heartbeat**: every 5s; players silent >15s are excluded from auto-reveal logic
- **History**: answers per question saved to `session.history` on reveal — used for Excel export

## Question fields

```ts
type Question = {
  id, type, text, options?, correct, timeLimit, explanation?, category?
}
```

- `category` shown above the question text on both host and player screens
- `explanation` shown in the reveal phase on both screens
- CSV template at `/public/template.csv` includes all columns

## Gamification (all toggleable per session)

- **Speed points**: faster correct answers = more points (max 1500 total)
- **Streaks**: bonus for consecutive correct answers
- **Teams**: players pick a team on join (leaderboard groups by team)

## Security

- `/admin` and `POST /api/session` protected by proxy middleware (`src/proxy.ts`)
- Admin login sets `admin_auth=1` httpOnly cookie (8h)
- Host-only endpoints require `x-host-token` header
- `hostToken` stripped from all poll responses

## Known limitations / future work

- Open-text answers are exact match (case-insensitive) — partial matches not supported
- No rate limiting on join endpoint
- QR code links to `/play/[id]` directly, bypassing the `/join` name-entry page
- Local folder is named `Typing/kahoot-klone` — rename `Typing` to `KahootKlone` when closing Claude Code
- Vercel KV free tier: 256MB, 30k requests/day — sufficient for workshops

## Dev

```bash
npm run dev     # starts on localhost:3000 (webpack)
npm run build   # production build check
```

Requires `.env.local` with `ADMIN_PASSWORD`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
