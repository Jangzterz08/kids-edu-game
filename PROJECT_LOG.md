# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **Fully deployed and live.**

- **Client:** `https://kids-edu-game.vercel.app` (Vercel, root=`client/`)
- **Server:** `https://kids-edu-game-production.up.railway.app` (Railway, root=`server/`)
- **Stack:** React + Vite / Express + Prisma 7 / Supabase PostgreSQL
- **12 modules, 107 lessons, 4 game types:** Matching, Quiz, Tracing, Spelling
- **PWA:** Icons, manifest, Workbox offline caching
- **Celebrations:** Emoji confetti, sparkle pop on quiz, bounce on match

## Railway Deployment Notes (for reference)

Nixpacks v1.38.0 pins a nixpkgs snapshot with Node 22.11.0 — incompatible with Prisma 7 (requires 22.12+/24+). **Fix: `server/Dockerfile` using `node:24-slim`.** Do NOT remove the Dockerfile.

Key Railway env vars set:
- `DATABASE_URL`, `NODE_ENV=production`, `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `PORT=3002`
- `ALLOWED_ORIGINS=https://kids-edu-game.vercel.app`

## Next Steps When We Return

1. **Test live app end-to-end:** Sign up, pick a kid profile, play all 4 game types, complete a module (check confetti fires).
2. **Audio improvements:** Replace browser TTS in `client/src/lib/sound.js` with real audio files — ElevenLabs API or recorded MP3s.
3. **Alphabet tracing SVG paths:** Add SVG `d` path data per letter + canvas finger-tracing detection in `client/src/components/games/TracingGame.jsx`.
4. **Custom domain (optional):** Add via Vercel settings.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/data/modules/*.js` | One file per module; defines lessons array |
| `client/src/components/games/` | MatchingGame, QuizGame, TracingGame, SpellingGame |
| `client/src/lib/sound.js` | TTS audio (replace with real files) |
| `client/src/pages/MiniGame.jsx` | Routes between games, records scores |
| `server/src/index.js` | Express entry; CORS with ALLOWED_ORIGINS |
| `server/Dockerfile` | Node 24-slim — do not remove (Nixpacks workaround) |
| `server/railway.toml` | healthcheckPath=/health, startCommand=node src/index.js |
