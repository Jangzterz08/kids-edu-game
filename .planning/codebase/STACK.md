# Technology Stack

**Analysis Date:** 2026-03-18

## Languages

**Primary:**
- JavaScript (ES Modules) - Client (`client/src/`) and server utility scripts
- JavaScript (CommonJS) - Server (`server/src/`)
- TypeScript - `server/prisma.config.ts` only (minimal usage)

## Runtime

**Environment:**
- Node.js >=20.0.0 (server requirement); Node.js 24 in production Docker image (`node:24-slim`)

**Package Manager:**
- npm
- Lockfiles: `client/package-lock.json`, `server/package-lock.json`, root `package-lock.json`

## Frameworks

**Client (frontend):**
- React 19.2.0 — UI framework
- Vite 7.3.1 — build tool and dev server (`client/vite.config.js`)
- react-router-dom 7.13.1 — client-side routing

**Server (backend):**
- Express 5.2.1 — HTTP server and REST API (`server/src/index.js`)

**PWA:**
- vite-plugin-pwa 1.2.0 — service worker + manifest generation, workbox runtime caching configured in `client/vite.config.js`

**Testing:**
- Not detected (no test framework in client or server)

**Build/Dev:**
- nodemon 3.1.14 — dev server auto-reload (`server/package.json`)
- ESLint 9.39.1 — linting for client (`client/eslint.config.js`)
- eslint-plugin-react-hooks 7.0.1 — hooks lint rules
- eslint-plugin-react-refresh 0.4.24 — fast refresh lint rules

## Key Dependencies

**Critical (Client):**
- `@supabase/supabase-js` ^2.98.0 — Supabase auth client; initialized in `client/src/lib/supabase.js`
- `react` ^19.2.0 — UI rendering
- `react-router-dom` ^7.13.1 — routing and navigation

**Critical (Server):**
- `@prisma/client` ^7.4.2 — ORM and database query client
- `@prisma/adapter-pg` ^7.4.2 — pg driver adapter for Prisma 7 (`server/src/lib/db.js`)
- `@supabase/supabase-js` ^2.98.0 — Supabase service-role client for JWT verification (`server/src/middleware/auth.js`)
- `jsonwebtoken` ^9.0.3 — custom kid PIN JWT signing/verification (`server/src/middleware/kidAuth.js`)
- `bcrypt` ^6.0.0 — kid PIN hashing
- `express` ^5.2.1 — HTTP server
- `node-cron` ^4.2.1 — weekly digest cron scheduler (`server/src/index.js`)
- `resend` ^6.9.3 — transactional email delivery (`server/src/services/weeklyDigest.js`)

**Infrastructure (Server):**
- `pg` ^8.20.0 — PostgreSQL client (used by Prisma adapter)
- `cors` ^2.8.6 — CORS middleware
- `dotenv` ^17.3.1 — environment variable loading
- `prisma` ^7.4.2 — CLI for migrations

**Root-level scripts (image/audio generation utilities):**
- `@napi-rs/canvas` ^0.1.96 — canvas rendering for image generation (`generate-images.js`)
- `msedge-tts` ^2.0.4 — text-to-speech audio generation (`generate-audio.js`)
- `sharp` ^0.34.5 — image processing (`generate-icons.js`)

## Configuration

**Environment (Client):**
- Vite env vars with `VITE_` prefix, read via `import.meta.env`
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `VITE_API_URL` — backend API base URL (defaults to `http://localhost:3002`)

**Environment (Server):**
- `dotenv` loads `.env` at startup via `require('dotenv').config()`
- `DATABASE_URL` — PostgreSQL connection string (Supabase session-mode pooler, port 5432, schema=kids_edu_game)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_KEY` — Supabase service role key
- `KID_JWT_SECRET` — secret for kid PIN JWTs
- `RESEND_API_KEY` — Resend transactional email API key
- `DIGEST_FROM_EMAIL` — sender address for weekly digest (defaults to `KidsLearn <digest@kidslearn.app>`)
- `CLIENT_URL` — frontend URL for email links (defaults to `https://kidslearn.app`)
- `ALLOWED_ORIGINS` — comma-separated CORS allowed origins
- `PORT` — HTTP port (defaults to 3002)
- `NODE_ENV` — controls dev/prod behavior

**Build:**
- Client: `client/vite.config.js` — Vite config with React plugin and PWA plugin
- Server: `server/Dockerfile` — Docker image `node:24-slim`, runs `npx prisma migrate deploy && node src/index.js`
- Server: `server/railway.toml` — Railway deployment config, uses Dockerfile builder, healthcheck at `/health`
- Client: `client/vercel.json` — SPA rewrite rule (`/* → /index.html`)
- Database: `server/prisma.config.ts` — Prisma config pointing to `prisma/schema.prisma`

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- PostgreSQL (via Supabase)
- `.env` files in `server/` and `client/` (not committed)

**Production:**
- Client: Vercel (auto-deploy via git, live at `kids-edu-game.vercel.app`)
- Server: Railway Docker container (live at `kids-edu-game-production.up.railway.app`)
- Database: Supabase PostgreSQL, project `efjbcsarporphqiuwuyw`, schema `kids_edu_game`, pooler `aws-1-eu-west-1.pooler.supabase.com:5432`

---

*Stack analysis: 2026-03-18*
