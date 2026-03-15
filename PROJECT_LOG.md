# KidsLearn (Kids Edu Game) — Project Log

## Quick Status Update

Full-stack kids educational app. **All changes UNCOMMITTED locally** (deploy pending).

- **Client:** `https://kids-edu-game.vercel.app` (Vercel, root=`client/`)
- **Server:** `https://kids-edu-game-production.up.railway.app` (Railway, root=`server/`)
- **Stack:** React + Vite / Express + Prisma 7 / Supabase PostgreSQL
- **Supabase:** `efjbcsarporphqiuwuyw`, schema `kids_edu_game`, pooler `aws-1-eu-west-1.pooler.supabase.com:5432`

## Ocean Mania Theme — COMPLETE (2026-03-15) — UNCOMMITTED

Full visual redesign from dark space → bright ocean world. All screens updated.

### Palette
- Sky: `#8BD4F2`, Cyan: `#3BBFE8`, Sand: `#E8C87A/#D4A84B`, Coral: `#C87060`, Green: `#4CC860`
- All glass surfaces: `rgba(255,255,255,0.35-0.45)` + `backdrop-filter:blur(16-20px)`
- Text: deep ocean `#0A4A6E` / mid `#1A7A9A`; Font: **Fredoka**

### CSS Variables updated (`index.css`)
- `--glass-bg` → `rgba(255,255,255,0.38)` (was dark navy `rgba(4,40,90,0.45)`)
- `--text-primary` → `#0A4A6E`, `--text-secondary` → `#1A7A9A`
- `--shadow-*` → ocean-tinted (was heavy black shadows)
- `--glass-pill` → bright white glass

### Components updated
| File | Change |
|------|--------|
| `KidLayout.jsx` | Animated OceanScene: waves, seaweed, coral, fish, bubbles |
| `OllieMascot.jsx` | NEW: CSS octopus mascot (8 wiggling tentacles) |
| `OceanFish.jsx` | NEW: shared fish+bubbles overlay for Login & KidSelect |
| `Login.jsx` | Ocean gradient bg, white glass card, forgot-password, OceanFish |
| `RoleSelector.jsx` | Kid=orange, Parent=cyan, Teacher=green gradient cards |
| `KidSelect.jsx` | Full ocean gradient bg, glass cards, OceanFish swimming behind |
| `KidCard.jsx` | White glass, cyan active glow, ocean blue text |
| `AddKidModal.jsx` | White glass modal, Fredoka labels |
| `AvatarPicker.jsx` | Cyan selection state |
| `KidHome.jsx` | White glass sidebar + panel, Ollie at bottom |
| `ModuleIntro.jsx` | White glass card, ocean colors |
| `MatchingGame.jsx` | White glass flip cards, lighter shadows, ocean text |
| `PatternGame.jsx` | White glass pattern box, `🌊` title, ocean progress pill |
| `OddOneOutGame.jsx` | White glass grid, `🦀` title, ocean progress pill |
| `QuizGame.jsx` | Sea creature sparkle `🐠🐡🌟🐚` (was `✨⭐🌟💫`) |
| `CelebrationModal.jsx` | Sea creature burst `🐠🐡🐚🌟🦀🐙⭐🎉`, ocean overlay |
| `DotGrid.jsx` | `SEA_EMOJIS` (🐠🐡🐚🦀🐙…) replaced `SPACE_EMOJIS` (🚀🪐👽…) |
| `index.css` | `swim` keyframe: baked `scaleX(-1)` so fish face swim direction |

### TTS / sound fixes (`sound.js`)
- `PHONETIC_MAP`: `cat`→`catt`, `bat`→`batt`, etc. to fix "cayt" mispronunciation
- Voice priority: Ava/Karen first (Samantha last — she mispronounces short vowels)
- Rate: `0.85`→`0.92`, pitch: `1.15`→`1.1`

## Role-Based Login + Classroom System — UNCOMMITTED

Kid/Parent/Teacher login, classroom leaderboards.

### Server
- Dual JWT: Kids use custom JWT (PIN), Parents/Teachers use Supabase JWT
- `kidAuth.js`: sign/verify kid JWT. Needs `KID_JWT_SECRET` env var on Railway
- `auth.js`: `/kid-lookup`, `/kid-login`, `/kid-set-pin` (public endpoints)
- `classrooms.js`: CRUD, leaderboard (stars→streak), 6-char join codes
- Schema: `pin String?` on `KidProfile` — **migration applied locally + on Supabase** ✓
- Prisma client regenerated (`prisma generate` run) ✓ — kid login now works locally

### Client
- `PinKeypad.jsx`, `RoleSelector.jsx`, `SetPinModal.jsx`, `TeacherLayout.jsx`
- `TeacherDashboard.jsx`, `ClassroomDetail.jsx`, `KidLeaderboard.jsx`, `ParentClassrooms.jsx`
- `AuthContext`: `kidSession`, `signInAsKid()`, `signOutKid()`. Kid tokens in `sessionStorage`

## Known Issue — Coins Show 0 in CoinStore

**Status:** NOT FIXED. `CoinStore.jsx` + `progressSync.js` not yet investigated.

## Railway Deployment Notes

- **DO NOT remove `server/Dockerfile`** (node:24-slim) — Nixpacks pins incompatible Node version
- `KID_JWT_SECRET` must be added to Railway env vars before deploying
- `prisma migrate deploy` runs automatically via `railway.toml`

Key Railway env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `NODE_ENV=production`, `PORT=3002`, `ALLOWED_ORIGINS=https://kids-edu-game.vercel.app`, **`KID_JWT_SECRET`**

Key Vercel env vars: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Next Steps When We Return

1. **Commit everything** — 36+ modified + 10 new files. All uncommitted.
2. **Add `KID_JWT_SECRET` to Railway** — required before kid login works in production.
3. **Deploy** — push server → Railway auto-deploys; push client → Vercel auto-deploys.
4. **Fix coins bug** — investigate `CoinStore.jsx` (how coins fetched) + `progressSync.js` (how awarded). Check DB: `SELECT name, coins FROM kids_edu_game."KidProfile"`.
5. **Test kid login end-to-end** — parent adds kid → sets PIN → kid logs in via name + PIN.
6. **Test classroom flow** — teacher creates classroom → parent joins → leaderboard shows.

## Key Files

| File | Purpose |
|------|---------|
| `client/src/components/OllieMascot.jsx` | CSS octopus mascot |
| `client/src/components/OceanFish.jsx` | Shared fish+bubble overlay (Login, KidSelect) |
| `client/src/components/layout/KidLayout.jsx` | Full ocean scene animation |
| `client/src/components/ui/DotGrid.jsx` | Sea creature counting grid for Numbers module |
| `client/src/lib/sound.js` | TTS with phonetic corrections + voice priority |
| `client/src/pages/Login.jsx` | Role selector + 3 login flows + forgot password |
| `client/src/pages/KidSelect.jsx` | "Who's playing today?" — parent picks kid |
| `server/src/middleware/kidAuth.js` | Kid JWT sign/verify |
| `server/src/routes/classrooms.js` | Classroom CRUD + leaderboard |
| `server/src/services/progressSync.js` | Upserts progress + awards coins |
| `server/Dockerfile` | Node 24-slim — DO NOT REMOVE |
| `server/railway.toml` | Runs `prisma migrate deploy` on deploy |
