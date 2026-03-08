# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **All core features working locally. Pushed to GitHub. Railway server deploy in progress (may still need Node version tweak).**

- **Stack:** React + Vite (client) / Express + Prisma (server) / Supabase PostgreSQL
- **12 modules, 107 lessons:** Alphabet (26), Numbers (10), Shapes (8), Colors (10), Animals (10), Body Parts (8), Manners (7), Household (8), Food Pyramid (7), Emotions (8), Weather (8), Days of Week (7)
- **4 game types:** Matching 🃏, Quiz ❓, Tracing ✏️, Spelling 🔤
- **PWA:** `vite-plugin-pwa` configured — icons (192, 512, apple-touch), manifest, Workbox offline caching
- **Celebrations:** Emoji confetti burst in `CelebrationModal`, sparkle pop on correct quiz answer, bounce on matched pairs
- **Spelling game:** `SpellingGame.jsx` — tap letter tiles to spell word shown as image/emoji; added to 6 modules
- **CORS:** Server uses `ALLOWED_ORIGINS` env var + auto-allows `*.vercel.app`
- **Git:** 8 commits on `main`, pushed to `https://github.com/Jangzterz08/kids-edu-game`

## Railway Deploy Status

Server URL: `https://kids-edu-game-production.up.railway.app`

**Fixes applied (in order):**
1. Railway Variables set: `DATABASE_URL`, `NODE_ENV=production`, `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `PORT=3002`
2. `server/package.json`: added `"engines": { "node": ">=20" }` (commit `d62074f`)
3. `server/railway.toml`: added `buildCommand = "npm install && npx prisma generate"` (commit `11bba85`)
4. `server/package.json`: moved `prisma` from `devDependencies` → `dependencies` (commit `8b1f1b3`) — fixes `npm ci` skipping it under `NODE_ENV=production`

**Potential remaining issue:** Build logs showed "Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+". If `">=20"` causes Nixpacks to pick Node 20.18 or lower, the build will still fail. Fix: change engines to `"node": ">=20.19"` in `server/package.json`, run `npm install` to update lock file, push.

**Vercel (client):** NOT deployed yet — waiting for Railway to be healthy first.

## Next Steps When We Return

1. **Check Railway build result:** Look at Build Logs for latest deployment. If still failing with Node version error, update `server/package.json` engines to `"node": ">=20.19"`, run `npm install`, push.
2. **Verify `/health` endpoint:** Once Railway is green, hit `https://kids-edu-game-production.up.railway.app/health` — should return `{"status":"ok"}`.
3. **Deploy client to Vercel:** Connect `github.com/Jangzterz08/kids-edu-game`, set root to `client/`, add `VITE_API_URL=https://kids-edu-game-production.up.railway.app`.
4. **Update `ALLOWED_ORIGINS`** on Railway after Vercel URL is known (add `ALLOWED_ORIGINS=https://YOUR_APP.vercel.app`).
5. **Audio improvements (#5):** Replace browser TTS in `client/src/lib/sound.js` with real audio files (ElevenLabs or recorded).
6. **Alphabet tracing SVG paths (#6):** Add SVG `d` path data per letter + canvas finger-tracing in `TracingGame.jsx`.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/data/index.js` | Module registry — import/export all modules |
| `client/src/data/modules/*.js` | One file per module; defines lessons array |
| `client/src/components/games/` | MatchingGame, QuizGame, TracingGame, SpellingGame |
| `client/src/components/ui/CelebrationModal.jsx` | Confetti + emoji burst on module complete |
| `client/src/pages/MiniGame.jsx` | Routes between games, records scores |
| `server/src/index.js` | Express entry; CORS with ALLOWED_ORIGINS |
| `server/src/seed.js` | Seeds all 107 lessons to Supabase |
| `server/railway.toml` | Nixpacks build config; buildCommand runs prisma generate |
| `server/package.json` | `engines.node >=20`; `prisma` in dependencies (not dev) |
| `client/vercel.json` | SPA rewrite rule for React Router |
