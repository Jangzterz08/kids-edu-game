# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **Both client and server deployed.**

- **Client:** `https://kids-edu-game.vercel.app` (Vercel, root=`client/`)
- **Server:** `https://kids-edu-game-production.up.railway.app` (Railway, root=`server/`)
- **Stack:** React + Vite / Express + Prisma 7 / Supabase PostgreSQL
- **Supabase:** `efjbcsarporphqiuwuyw`, schema `kids_edu_game`, pooler `aws-1-eu-west-1.pooler.supabase.com:5432`

## GSD Planning State (2026-03-19)

Using `/gsd` workflow to plan and execute production polish features.

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Security Hardening | ✓ COMPLETE | SEC-01–06 all executed and committed |
| Phase 2: Polish & UX | ⬜ PLANNED (partial) | Research + UI-SPEC done; PLAN.md not yet created |

### Phase 2 artifacts created
- `.planning/phases/02-polish-ux/02-RESEARCH.md` — technical research (sonner, avatar map, CSP, PWA, OG meta)
- `.planning/phases/02-polish-ux/02-UI-SPEC.md` — UI design contract approved (6/6 dimensions)
- `.planning/phases/02-polish-ux/02-VALIDATION.md` — Nyquist validation strategy

### Phase 2 requirements (POL-01 to POL-09)
1. **POL-01** Toast notifications (coin earn, streak, offline) — use `sonner` 2.0.7
2. **POL-02** React Error Boundary (crash recovery screen with Ollie octopus)
3. **POL-03** PWA install prompt (Android: `beforeinstallprompt`; iOS: share tooltip)
4. **POL-04** ParentDashboard shows correct purchased avatar (not fallback bear)
5. **POL-05** OG meta tags + social preview image
6. **POL-06** Security headers in `vercel.json` (CSP — caution: can break Supabase/Railway)
7. **POL-07** Single shared avatar map in `client/src/lib/avatars.js` (7 files currently duplicate it)
8. **POL-08** Remove client-side `computeStars` from `MiniGame.jsx` (server already returns `starsEarned`)
9. **POL-09** Daily challenge `/api/daily-challenge/today` route ordering fix (must be before `/:kidId`)

### Key research findings
- Avatar mismatch: `ParentDashboard.jsx` has 8 avatars, `KidHome.jsx` has 16 — all 7 files need to import from single source
- CSP is highest-risk — wrong directives silently break Supabase API calls; `connect-src` must include Supabase + Railway
- Route ordering bug confirmed: `today` literal must be registered before `/:kidId` in `dailyChallenge.js`
- `vite-plugin-pwa` v1.2.0 already installed; PWA install prompt is separate client-side `beforeinstallprompt` hook

## Ocean Theme + App Features — DEPLOYED

All features live:
- 13 modules, 117 lessons, 8 game types (matching, tracing, quiz, spelling, phonics, pattern, oddOneOut, scramble)
- Ocean theme (Fredoka font, animated OceanScene), Ollie octopus mascot
- Dual JWT auth (Supabase parent/teacher + custom kid PIN JWT)
- Coins, CoinStore (8 avatars), streak, achievements, weekly digest cron
- Classrooms (teacher creates → join code → parent enrolls → leaderboard)
- Daily Challenge (auto-complete on ModuleComplete, +20 bonus coins)

## Railway Deployment Notes

- **DO NOT remove `server/Dockerfile`** (node:24-slim) — Nixpacks pins incompatible Node version
- `prisma migrate deploy` runs automatically via `railway.toml`
- Key env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NODE_ENV=production`, `PORT=3002`, `ALLOWED_ORIGINS=https://kids-edu-game.vercel.app`, `KID_JWT_SECRET`

## Next Steps When We Return

1. **`/gsd:plan-phase 2`** — creates PLAN.md files. Research and UI-SPEC are done; will go straight to planning.
2. **`/gsd:execute-phase 2`** — run after plans are created.
3. **CSP headers (POL-06) — test carefully** — verify `connect-src` includes both Supabase and Railway URLs before merging.
4. **Verify `KID_JWT_SECRET` on Railway** — required for kid PIN login in production.

## Key Files

| File | Purpose |
|------|---------|
| `.planning/phases/02-polish-ux/02-RESEARCH.md` | Phase 2 research (libraries, pitfalls, file paths) |
| `.planning/phases/02-polish-ux/02-UI-SPEC.md` | Approved UI design contract |
| `client/src/components/layout/KidLayout.jsx` | Ocean scene animation |
| `client/src/lib/sound.js` | TTS with phonetic corrections + voice priority |
| `server/src/middleware/kidAuth.js` | Kid JWT sign/verify |
| `server/src/routes/dailyChallenge.js` | Daily challenge routes (POL-09 fix target) |
| `server/src/services/progressSync.js` | Upserts progress + awards coins |
| `server/Dockerfile` | Node 24-slim — DO NOT REMOVE |
