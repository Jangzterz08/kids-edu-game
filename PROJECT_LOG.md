# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **All core features working locally.**

- **Stack:** React + Vite (client) / Express + Prisma (server) / Supabase PostgreSQL
- **12 modules, 107 lessons:** Alphabet (26), Numbers (10), Shapes (8), Colors (10), Animals (10), Body Parts (8), Manners (7), Household (8), Food Pyramid (7), Emotions (8), Weather (8), Days of Week (7)
- **4 game types:** Matching 🃏, Quiz ❓, Tracing ✏️, Spelling 🔤
- **PWA:** `vite-plugin-pwa` configured — icons (192, 512, apple-touch), manifest, service worker with Workbox offline caching
- **Celebrations:** Emoji confetti burst in `CelebrationModal`, sparkle pop on correct quiz answer, bounce animation on matching pair
- **Spelling game:** `SpellingGame.jsx` — tap letter tiles to spell word shown as image/emoji; added to 6 modules (animals, bodyParts, colors, emotions, weather, daysOfWeek)
- **Deployment configs:** `client/vercel.json` (SPA rewrite) + `server/railway.toml` (Nixpacks, healthcheck at `/health`) — ready to deploy
- **CORS:** Server uses `ALLOWED_ORIGINS` env var + auto-allows `*.vercel.app`
- **Git:** Initialized, 5 commits on `main`. **No GitHub remote yet.**

## Blocker: GitHub repo not created yet

Remote was removed after failed push to placeholder URL. Need to:
1. Create repo at `github.com/Jangzterz08/kids-edu-game` (no README init)
2. `git remote add origin https://github.com/Jangzterz08/kids-edu-game.git`
3. `git push -u origin main`

## Next Steps When We Return

1. **Push to GitHub:** Create repo on github.com as `Jangzterz08/kids-edu-game`, then run the two git commands above.
2. **Deploy server to Railway:** Connect GitHub repo, set root to `server/`, add env vars from `server/.env.example` (use real values from `server/.env`). Add `ALLOWED_ORIGINS=https://YOUR_APP.vercel.app`.
3. **Deploy client to Vercel:** Connect GitHub repo, set root to `client/`, add env vars from `client/.env.example` (set `VITE_API_URL` to your Railway server URL).
4. **Update `ALLOWED_ORIGINS`** on Railway after Vercel URL is known.
5. **Audio improvements (#5):** Generate real audio files via ElevenLabs or record them; replace browser TTS in `client/src/lib/sound.js`.
6. **Alphabet tracing SVG paths (#6):** Hardest task — needs SVG `d` path data for each letter, then canvas-based finger-tracing detection in `TracingGame.jsx`.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/data/index.js` | Module registry — import/export all modules |
| `client/src/data/modules/*.js` | One file per module; defines lessons array |
| `client/src/components/games/` | MatchingGame, QuizGame, TracingGame, SpellingGame |
| `client/src/components/ui/CelebrationModal.jsx` | Confetti + emoji burst on module complete |
| `client/src/pages/MiniGame.jsx` | Routes between games, records scores |
| `server/src/index.js` | Express entry; CORS config |
| `server/src/seed.js` | Seeds all 107 lessons to Supabase |
| `generate-images.js` | Canvas-based image generation (needs `node --input-type=module`) |
| `generate-icons.js` | PWA icon generation (same invocation style) |
