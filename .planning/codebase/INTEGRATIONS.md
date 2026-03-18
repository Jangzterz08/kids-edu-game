# External Integrations

**Analysis Date:** 2026-03-18

## APIs & External Services

**Email:**
- Resend — transactional email for weekly parent digest
  - SDK/Client: `resend` npm package ^6.9.3
  - Auth: `RESEND_API_KEY` env var (server)
  - Implementation: `server/src/services/weeklyDigest.js`
  - Trigger: `node-cron` job every Monday 08:00 (`server/src/index.js`)

**Text-to-Speech (dev/content generation only):**
- Microsoft Edge TTS — generates audio files for lesson content
  - SDK/Client: `msedge-tts` npm package ^2.0.4
  - Used by: root-level `generate-audio.js` utility script (not part of the runtime app)

## Data Storage

**Databases:**
- Supabase PostgreSQL (primary database)
  - Provider: Supabase project `efjbcsarporphqiuwuyw`, schema `kids_edu_game`
  - Pooler: `aws-1-eu-west-1.pooler.supabase.com:5432` (session mode, not transaction mode — required for Prisma)
  - Connection env var: `DATABASE_URL` (server)
  - Client/ORM: Prisma 7 with `@prisma/adapter-pg` driver adapter (`server/src/lib/db.js`)
  - Schema file: `server/prisma/schema.prisma`
  - Migrations: `server/prisma/migrations/` — 6 applied migrations (init through `add_scramble_score`)

**File Storage:**
- Local filesystem — lesson audio files and images are served as static assets from the client (`client/public/`)
- No cloud file storage detected

**Caching:**
- Workbox (PWA service worker) — caches Supabase API responses in browser (`client/vite.config.js`)
  - Cache name: `supabase-cache`, NetworkFirst strategy, 24h TTL, max 50 entries
  - Also caches static assets: `**/*.{js,css,html,png,webp,mp3,svg}`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — handles parent/teacher authentication (email/password)
  - Client SDK: `@supabase/supabase-js` ^2.98.0
  - Client init: `client/src/lib/supabase.js` (uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
  - Server verification: `server/src/middleware/auth.js` uses `supabase.auth.getUser(token)` with service role key (`SUPABASE_SERVICE_KEY`)
  - Email confirmation: disabled in Supabase dashboard

**Custom Kid PIN Auth:**
- Server-issued JWTs for child profiles (kids have no Supabase account)
  - Implementation: `server/src/middleware/kidAuth.js`
  - Algorithm: `jsonwebtoken` HS256, 8h expiry
  - Secret: `KID_JWT_SECRET` env var (server)
  - Token type detection: `decodeTokenType()` inspects `type` claim — `'kid'` vs Supabase token
  - PIN storage: bcrypt-hashed 4–6 digit PIN on `KidProfile.pin` field
  - Client storage: kid token stored in `sessionStorage` under key `kidToken` (`client/src/lib/api.js`)

**Auth Flow:**
- Parents/teachers: Supabase email/password → Supabase JWT → validated server-side via `supabase.auth.getUser()`
- Kids: parent looks up kid by name → kid enters PIN → server validates PIN, issues custom JWT → client stores in `sessionStorage`
- Auth context: `client/src/context/AuthContext.jsx` (Supabase session) + `client/src/context/KidContext.jsx` (kid session)

## Monitoring & Observability

**Error Tracking:**
- Not detected — no Sentry, Datadog, or similar SDK present

**Logs:**
- `console.log` / `console.error` throughout server code
- Railway captures stdout/stderr container logs
- Server error handler middleware: `server/src/index.js` — logs `err.message`, returns stack trace in development only

**Health Check:**
- `GET /health` endpoint returns `{ status: 'ok', timestamp }` — used by Railway healthcheck (`server/railway.toml`)

## CI/CD & Deployment

**Client Hosting:**
- Vercel — auto-deploys on git push to `main`
  - SPA rewrite rule configured in `client/vercel.json`
  - Live URL: `kids-edu-game.vercel.app`

**Server Hosting:**
- Railway — Docker-based deployment
  - Config: `server/railway.toml` (builder = dockerfile, healthcheck at `/health`)
  - Dockerfile: `server/Dockerfile` — `node:24-slim`, runs `npx prisma migrate deploy` then `node src/index.js`
  - Live URL: `kids-edu-game-production.up.railway.app`

**CI Pipeline:**
- Not detected — no GitHub Actions, CircleCI, or similar pipeline config found

**Database Migrations:**
- Run automatically on server container start via `npx prisma migrate deploy` (in `server/Dockerfile` CMD)
- Manual migration creation: `npm run migrate` in `server/`

## Environment Configuration

**Required env vars (server):**
- `DATABASE_URL` — PostgreSQL connection string with `?schema=kids_edu_game`
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key (for JWT verification)
- `KID_JWT_SECRET` — Secret for signing kid PIN JWTs
- `RESEND_API_KEY` — Resend email API key (weekly digest skipped if absent)
- `ALLOWED_ORIGINS` — Comma-separated CORS origins
- `PORT` — Server port

**Required env vars (client):**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon (public) key
- `VITE_API_URL` — Backend API URL (e.g., `https://kids-edu-game-production.up.railway.app`)

**Optional env vars (server):**
- `DIGEST_FROM_EMAIL` — Sender address for weekly digest
- `CLIENT_URL` — Frontend URL embedded in digest email links
- `NODE_ENV` — Enables stack traces in error responses when `development`

**Secrets location:**
- `.env` files (not committed to git), set as environment variables in Railway (server) and Vercel (client) dashboards

## Webhooks & Callbacks

**Incoming:**
- None detected — no webhook endpoint handlers found in `server/src/routes/`

**Outgoing:**
- None detected — server only sends emails via Resend; no outgoing webhook calls

---

*Integration audit: 2026-03-18*
