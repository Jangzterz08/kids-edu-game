# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **Fully deployed and live.**

- **Client:** `https://kids-edu-game.vercel.app` (Vercel, root=`client/`)
- **Server:** `https://kids-edu-game-production.up.railway.app` (Railway, root=`server/`)
- **Stack:** React + Vite / Express + Prisma 7 / Supabase PostgreSQL
- **12 modules, 107 lessons, 5 game types:** Matching, Quiz, Tracing, Spelling, Phonics
- **Phonics game:** Now in all 12 modules (was Alphabet-only).
- **Streak counter:** `currentStreak` + `lastActivityDate` on KidProfile. Orange 🔥 badge on KidHome.
- **Module badges:** Yellow badge row on KidHome, ✅ overlay on completed ModuleCards.
- **Mascot "Sunny":** Emoji-based character with 6 moods. On KidHome + CelebrationModal.
- **Audio:** 147 pre-generated MP3s in `client/public/audio/` (en-US-AriaNeural). TTS fallback.
- **SpeakAlongButton:** Mic-based word recognition (Web Speech API). iOS Safari fallback → `TypeItButton` (text input + fuzzy Levenshtein match). Lives in `client/src/components/lesson/SpeakAlongButton.jsx`.
- **Coin economy:** `coins Int` + `unlockedItems String` on KidProfile (migrated). `progressSync.js` awards 5 coins per star delta. `CelebrationModal` shows "+N 🪙 coins earned!". KidHome shows coin badge → `/play/store`.
- **CoinStore:** 8 premium avatars (🐸30🐥40🐹60🐼80🦋100🐉120🦖150🦄200). `POST /api/kids/:kidId/store/buy`. `KidCard` + `KidHome` AVATAR_EMOJIS include all 16 avatars.
- **Weekly email digest:** `node-cron` (Mon 08:00) + `resend` SDK. `server/src/services/weeklyDigest.js`. Sends HTML email per parent with each kid's stars/streak/lessons-this-week/recommended module.

## Railway Deployment Notes

Nixpacks v1.38.0 pins Node 22.11.0 — incompatible with Prisma 7. **Fix: `server/Dockerfile` using `node:24-slim`.** Do NOT remove the Dockerfile.

Key Railway env vars:
- `DATABASE_URL`, `NODE_ENV=production`, `SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `PORT=3002`
- `ALLOWED_ORIGINS=https://kids-edu-game.vercel.app`

Key Vercel env vars:
- `VITE_API_URL=https://kids-edu-game-production.up.railway.app`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Next Steps When We Return

1. **Deploy to production:** Commit all unstaged changes (see git status — large batch), push, let Railway + Vercel auto-deploy. Remember to add `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, `CLIENT_URL` to Railway env vars for the email digest to work.
2. **Resend setup for digest:** Sign up at resend.com, verify domain (or use `onboarding@resend.dev` for testing), get API key, add to Railway + local `.env`.
3. **Monetization (next feature):** Stripe Checkout + `isPremium` field on User. Freemium: 3 free modules; unlock all for $2.99–$4.99. Say "add Stripe paywall to KidsLearn" to start.
4. **Interest theme personalization:** Ask theme on profile create (Dinosaurs, Space, Ocean). Swap module card backgrounds + celebration sounds per theme.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/data/modules/*.js` | One file per module; defines lessons + games arrays |
| `client/src/components/games/` | MatchingGame, QuizGame, TracingGame, SpellingGame, PhonicsGame |
| `client/src/components/lesson/SpeakAlongButton.jsx` | Mic + TypeItButton iOS fallback |
| `client/src/pages/CoinStore.jsx` | Premium avatar store |
| `client/src/pages/KidHome.jsx` | Home — streak/coin badges, module grid, Sunny mascot |
| `client/src/pages/ParentDashboard.jsx` | Stat cards, weekly chart, accuracy bars, recommended |
| `client/src/pages/MiniGame.jsx` | Routes between all 5 game types |
| `server/src/routes/kids.js` | CRUD + `POST /store/buy` endpoint |
| `server/src/services/progressSync.js` | Upserts progress + awards coins |
| `server/src/services/weeklyDigest.js` | Weekly email via Resend |
| `server/src/index.js` | Express app + node-cron weekly digest schedule |
| `server/Dockerfile` | Node 24-slim — do not remove |
| `server/railway.toml` | Runs `prisma migrate deploy` before server start |

## Monetization Options (for later)

**Option 1 — Freemium (recommended first)**
- Free: Alphabet, Numbers, Colors (3 modules); Paid: unlock all 12 — $2.99–$4.99 one-time or $2.99/mo
- Implementation: Stripe Checkout + `isPremium` field on User model

**Option 2 — Family subscription** — $4.99/month or $29.99/year, Stripe Billing

**Option 3 — App Store** — Wrap PWA with Capacitor → App Store + Google Play

**Option 4 — School/B2B licenses** — $99–$299/year per school + teacher dashboard

**When ready:** Say "add Stripe paywall to KidsLearn" to start building.
