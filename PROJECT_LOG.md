# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **Deployed and live** (migrated to new Supabase project 2026-03-12).

- **Client:** `https://kids-edu-game.vercel.app` (Vercel, root=`client/`)
- **Server:** `https://kids-edu-game-production.up.railway.app` (Railway, root=`server/`)
- **Stack:** React + Vite / Express + Prisma 7 / Supabase PostgreSQL
- **Supabase project:** `efjbcsarporphqiuwuyw` (Portfolio project, schema `kids_edu_game`)
- **DB connection:** `aws-1-eu-west-1.pooler.supabase.com:5432` (session mode)
- **12 modules, 117 lessons, 5 game types:** Matching, Quiz, Tracing, Spelling, Phonics
- **Features:** Streak counter, module badges, mascot "Sunny", 147 audio MP3s, SpeakAlongButton (iOS fallback), coin economy, CoinStore (8 premium avatars), weekly email digest

## Supabase Migration (2026-03-12)

Old project `srqlgkyunqnbimhfyypg` was paused (free tier limit). Migrated to Portfolio project `efjbcsarporphqiuwuyw`:
- Created `kids_edu_game` schema (isolated from Portfolio's `public` schema)
- Ran `prisma db push` + baselined 3 migrations with `prisma migrate resolve --applied`
- Seeded 12 modules, 117 lessons
- Updated all env files (client/.env, client/.env.production, server/.env)
- Updated Railway + Vercel env vars
- Disabled email confirmation in Supabase Auth settings

## Known Issue — Coins Not Awarding

**Status:** Fix pushed (commit `7bc2a9c`), awaiting Railway redeploy verification.

**Root cause:** Railway Docker cache served stale Prisma client without `coins`/`unlockedItems` fields. The `kidProfile.update({ coins: { increment } })` silently failed because Prisma client didn't know the field.

**Fix:** Added comment to `schema.prisma` to bust Docker layer cache. If coins still don't work after Railway auto-deploys, redeploy with **"Clear build cache"** checked.

**Verify with:** `SELECT name, coins, "totalStars" FROM kids_edu_game."KidProfile"` — coins should increment when playing games.

## Railway Deployment Notes

Nixpacks v1.38.0 pins Node 22.11.0 — incompatible with Prisma 7. **Fix: `server/Dockerfile` using `node:24-slim`.** Do NOT remove the Dockerfile.

Key Railway env vars:
- `DATABASE_URL=postgresql://postgres.efjbcsarporphqiuwuyw:I5CWRveZb2pnXzE0@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?schema=kids_edu_game`
- `SUPABASE_URL=https://efjbcsarporphqiuwuyw.supabase.co`
- `SUPABASE_SERVICE_KEY` (service_role key for efjbcsarporphqiuwuyw)
- `NODE_ENV=production`, `PORT=3002`, `ALLOWED_ORIGINS=https://kids-edu-game.vercel.app`

Key Vercel env vars:
- `VITE_API_URL=https://kids-edu-game-production.up.railway.app`
- `VITE_SUPABASE_URL=https://efjbcsarporphqiuwuyw.supabase.co`
- `VITE_SUPABASE_ANON_KEY` (anon key for efjbcsarporphqiuwuyw)

## Adaptive Learning & Teacher Portal — Plan Approved (2026-03-13)

Full plan at `.claude/plans/concurrent-munching-matsumoto.md`. Six phases:

1. **Phase 1 — Schema Foundation:** Add `spellingScore`, `phonicsScore`, `difficultyLevel` to `LessonProgress`. New models: `ModuleDifficulty`, `ReviewSchedule`, `DailyChallenge`, `Classroom`. Add `role` to `User`. Fix scoring bug.
2. **Phase 2 — Pretest + Adaptive Difficulty:** 6-question diagnostic quiz per module → places kid at easy/medium/hard. Difficulty config for all 5 game types. Real-time adjustment via rolling accuracy (last 5 games).
3. **Phase 3 — Spaced Repetition:** Simplified SM-2 algorithm. Auto-schedules reviews. "Review" badge on KidHome with due-count.
4. **Phase 4 — Mastery Gates:** 4 tiers (0/20/50/80 stars). Locked modules show lock icon + "Need X more stars".
5. **Phase 5 — Daily Challenge + Boss Levels:** Daily special game (bonus 10 coins). 10-question end-of-module boss gauntlet (20 coins + badge).
6. **Phase 6 — Teacher Portal:** Teacher accounts, classrooms with join codes, class analytics dashboard, per-student deep dive, assignments, CSV export.

### Known bug (pre-existing)
- `spellingScore` and `phonicsScore` NOT in Prisma schema → those game scores are silently lost. Fixed in Phase 1.
- Unstaged WIP: `OddOneOutGame.jsx`, `PatternGame.jsx`, `logic.js` module, edits to `index.js` + `MiniGame.jsx`.

## Next Steps When We Return

1. **Start Phase 1:** Run the Prisma schema migration (add new fields + models). Fix `progressSync.js` to handle all 5 scores.
2. **Phase 2 (Adaptive Core):** Build `adaptiveDifficulty.js` service, pretest API + UI, update all 5 game components with difficulty props.
3. **Verify coins fix:** If still broken, redeploy Railway with "Clear build cache".
4. **Resend setup for digest:** Sign up at resend.com, verify domain, get API key, add `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `CLIENT_URL` to Railway env vars.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/data/modules/*.js` | One file per module; defines lessons + games arrays |
| `client/src/components/games/` | MatchingGame, QuizGame, TracingGame, SpellingGame, PhonicsGame |
| `client/src/components/lesson/SpeakAlongButton.jsx` | Mic + TypeItButton iOS fallback |
| `client/src/pages/CoinStore.jsx` | Premium avatar store |
| `client/src/pages/KidHome.jsx` | Home — streak/coin badges, module grid, Sunny mascot |
| `client/src/pages/MiniGame.jsx` | Routes between all 5 game types |
| `server/src/services/progressSync.js` | Upserts progress + awards coins |
| `server/src/services/weeklyDigest.js` | Weekly email via Resend |
| `server/Dockerfile` | Node 24-slim — do not remove |
| `server/railway.toml` | Runs `prisma migrate deploy` before server start |
