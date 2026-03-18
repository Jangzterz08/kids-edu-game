# Architecture

**Analysis Date:** 2026-03-18

## Pattern Overview

**Overall:** Full-stack SPA with REST API backend — client-server separation deployed independently (Vercel + Railway)

**Key Characteristics:**
- React SPA (Vite) communicates with Express REST API via `fetch`-based client (`client/src/lib/api.js`)
- Dual-JWT authentication: Supabase JWTs for adults (parents/teachers), custom kid JWTs signed with `KID_JWT_SECRET`
- Content data is dual-sourced: static JS modules on the client (`client/src/data/`) mirror DB rows seeded via `server/src/seed.js`
- Offline-first progress: lesson scores saved to `localStorage` first, synced to server on next load
- Stars and coins computed server-side in `server/src/services/progressSync.js` — client never trusts its own star calculations for persistence

## Layers

**Client — Pages:**
- Purpose: Route-level components; compose context + hooks into UI
- Location: `client/src/pages/`
- Contains: `KidHome.jsx`, `LessonPlayer.jsx`, `MiniGame.jsx`, `ModuleComplete.jsx`, `ParentDashboard.jsx`, `TeacherDashboard.jsx`, `DailyChallenge.jsx`, `CoinStore.jsx`, `KidLeaderboard.jsx`, `ClassroomDetail.jsx`, `ParentClassrooms.jsx`, `KidSelect.jsx`, `ModuleIntro.jsx`, `Login.jsx`, `NotFound.jsx`
- Depends on: context, hooks, components, data layer
- Used by: React Router via `client/src/App.jsx`

**Client — Components:**
- Purpose: Reusable UI units organized by domain
- Location: `client/src/components/`
- Contains: `auth/` (ProtectedRoute, PinKeypad, RoleSelector), `games/` (8 game types), `layout/` (ParentLayout, KidLayout, TeacherLayout), `lesson/` (LessonCard, ProgressBar, SoundButton), `kid/` (AddKidModal, KidCard, AvatarPicker, SetPinModal), `classroom/` (LeaderboardTable, JoinClassroomModal), `modules/` (ModuleCard, ProgressRing, StarBadge), `ui/` (CelebrationModal, DotGrid), `mascot/` (Mascot.jsx)
- Depends on: context, lib
- Used by: pages

**Client — Context:**
- Purpose: Global state shared across routes
- Location: `client/src/context/`
- Contains:
  - `AuthContext.jsx` — Supabase session + custom kidSession (`{ token, kid }`); exposes `signInWithEmail`, `signUpWithEmail`, `signInAsKid`, `signOut`, `signOutKid`
  - `KidContext.jsx` — `activeKid` state + `kids[]` list; `selectKid`, `refreshKids`
- Depends on: `lib/supabase.js`, `lib/api.js`
- Used by: all pages and ProtectedRoute

**Client — Hooks:**
- Purpose: Stateful data-fetching logic
- Location: `client/src/hooks/`
- Contains: `useProgress.js` — fetches module progress, syncs dirty offline entries on mount, exposes `recordLesson(lessonSlug, update)`
- Depends on: `lib/api.js`, `lib/localStorage.js`
- Used by: LessonPlayer, MiniGame, DailyChallenge

**Client — Lib:**
- Purpose: Infrastructure utilities
- Location: `client/src/lib/`
- Contains:
  - `api.js` — `fetch` wrapper; resolves auth header (kid token > Supabase token); exports `api.get/post/put/delete` and `api.public.post`
  - `supabase.js` — Supabase client (null in dev if env vars absent)
  - `localStorage.js` — offline progress store keyed by `edu_progress_{kidId}`
  - `sound.js` — Web Speech API / audio file playback
- Depends on: nothing internal
- Used by: context, hooks, pages

**Client — Data:**
- Purpose: Static lesson content registry (mirrors DB seed)
- Location: `client/src/data/`
- Contains: `index.js` (MODULE_REGISTRY, `getModule`, `getLesson`, `getDailyChallengeSlug`, `buildQuizOptions`), `modules/*.js` (13 module files each exporting a module object with `slug`, `title`, `games[]`, `lessons[]`)
- Depends on: nothing
- Used by: LessonPlayer, MiniGame, ModuleIntro, DailyChallenge

**Server — Routes:**
- Purpose: Express route handlers; input validation and authorization
- Location: `server/src/routes/`
- Contains: `auth.js`, `kids.js`, `modules.js`, `progress.js`, `achievements.js`, `classrooms.js`, `dailyChallenge.js`
- Depends on: middleware/auth, lib/db, services/progressSync
- Used by: `server/src/index.js`

**Server — Middleware:**
- Purpose: Auth verification injected before all protected routes
- Location: `server/src/middleware/`
- Contains:
  - `auth.js` (`requireAuth`) — detects token type via `decodeTokenType`, validates kid JWT or Supabase JWT, sets `req.user = { id, type }`
  - `kidAuth.js` — `signKidToken`, `verifyKidToken`, `decodeTokenType`
- Depends on: `@supabase/supabase-js`, `jsonwebtoken`
- Used by: `server/src/index.js` (applied globally to all `/api/*` except kid-lookup/kid-login)

**Server — Services:**
- Purpose: Business logic extracted from routes
- Location: `server/src/services/`
- Contains:
  - `progressSync.js` — `upsertProgress(kidId, entry)`: computes stars (best-of rule), updates coins (+5 per new star delta, +3 otherwise), increments streak
  - `weeklyDigest.js` — `sendWeeklyDigests()`: queries all parents, emails per-kid stats via Resend
- Depends on: `lib/db`, Resend SDK
- Used by: routes/progress, index.js (cron)

**Server — Data Access:**
- Purpose: Single Prisma client instance
- Location: `server/src/lib/db.js`
- Contains: Prisma client via `@prisma/adapter-pg` (session-mode pooler); singleton in dev via `global.prisma`
- Depends on: `DATABASE_URL` env var, Supabase PostgreSQL schema `kids_edu_game`
- Used by: all routes and services

## Data Flow

**Kid Learning Session:**

1. Kid selects profile → `KidContext.activeKid` set
2. Kid navigates to module (`/play/:moduleSlug`) → `ModuleIntro` reads static `getModule(slug)` from `client/src/data/`
3. `LessonPlayer` loops through `mod.lessons`; each card-swipe calls `useProgress.recordLesson(lessonSlug, { viewed: true, starsEarned: 1 })`
4. `recordLesson` writes to `localStorage` first (offline safety), then `POST /api/progress/:kidId/lesson/:lessonSlug`
5. Server calls `upsertProgress` → computes stars, updates `LessonProgress`, increments coins and streak on `KidProfile`
6. After lessons, `MiniGame` runs game sequence defined in `mod.games[]`; on each game completion calls `recordLesson` with game-type score fields
7. On `ModuleComplete`, daily challenge auto-completion check fires; `POST /api/daily-challenge/:kidId/complete`

**Progress Offline Sync:**

1. `useProgress` mounts → checks `localStorage` for `dirty` flag
2. If dirty entries exist, `POST /api/progress/:kidId/sync` with array of `{lessonId, ...scores}`
3. Server `upsertProgress` runs for each entry (best-score merging)
4. On success: `markSynced` clears `dirty` flag in localStorage

**Authentication — Parent/Teacher:**

1. `Login.jsx` calls `AuthContext.signInWithEmail(email, password, role?)`
2. `supabase.auth.signInWithPassword` → Supabase JWT
3. `POST /api/auth/register` with Supabase Bearer token → server upserts `User` row
4. Subsequent API calls attach Supabase JWT via `api.js getAuthHeader()`
5. Server `requireAuth` validates via `supabase.auth.getUser(token)`

**Authentication — Kids (PIN):**

1. `PinKeypad` calls `AuthContext.signInAsKid(kidId, pin)`
2. `POST /api/auth/kid-login` (public, no auth header) → server bcrypt-compares PIN → signs kid JWT
3. Token stored in `sessionStorage` as `kidToken`
4. All subsequent API calls send kid JWT; server `decodeTokenType` routes to `verifyKidToken`

**State Management:**
- No external state library (no Redux/Zustand)
- Two React contexts: `AuthContext` (session/user/kidSession), `KidContext` (kids list + activeKid)
- Server-fetched data fetched directly in pages and `useProgress` hook via local `useState`

## Key Abstractions

**Module Registry (static):**
- Purpose: In-memory catalogue of all 13 learning modules and their lessons
- Examples: `client/src/data/index.js`, `client/src/data/modules/alphabet.js`
- Pattern: Each module exports `{ slug, title, iconEmoji, games: string[], lessons: { slug, word, imageFile, audioFile, ... }[] }`; `MODULE_REGISTRY` is the flat array

**Game Components:**
- Purpose: Self-contained mini-games that receive `lessons[]` and call `onComplete(score: 0-100)` when done
- Examples: `client/src/components/games/MatchingGame.jsx`, `client/src/components/games/WordScramble.jsx`
- Pattern: `MiniGame.jsx` acts as orchestrator — iterates `mod.games[]`, renders the matching component, collects scores

**resolveKidAccess / resolveWriteAccess (server):**
- Purpose: Role-based ownership check pattern repeated across routes
- Examples: `server/src/routes/progress.js`, `server/src/routes/achievements.js`
- Pattern: Helper function checks `req.user.type === 'kid'` (kid JWT) vs Supabase user role (parent/teacher); returns `KidProfile` or `null`

**progressSync Service:**
- Purpose: Centralizes all star/coin/streak computation; called by both single-lesson and bulk-sync routes
- Examples: `server/src/services/progressSync.js`
- Pattern: Best-score merging (never reduces scores); `computeStars` applies 80% threshold for 3 stars, 60% for 2

## Entry Points

**Client:**
- Location: `client/src/main.jsx`
- Triggers: Vite dev server or static HTML in `client/dist/`
- Responsibilities: Mounts `<App />` into `#root`

**Client App:**
- Location: `client/src/App.jsx`
- Triggers: Imported by `main.jsx`
- Responsibilities: Wraps `AuthProvider > KidProvider > BrowserRouter`; defines all routes with `ProtectedRoute` guards; lazy-loads all page components

**Server:**
- Location: `server/src/index.js`
- Triggers: `node src/index.js` (Railway via Dockerfile)
- Responsibilities: Mounts Express middleware (CORS, JSON), registers all routes with `requireAuth`, registers weekly digest cron, starts HTTP server on `PORT`

## Error Handling

**Strategy:** Express error-forwarding (`next(err)`) with centralized handler in `server/src/index.js`

**Patterns:**
- All route handlers wrap logic in `try/catch` and call `next(err)` on failure
- Error handler at `server/src/index.js` lines 47-53 returns `{ message }` JSON; includes stack trace in dev
- Client `api.js` throws `Error(err.message || err.error)` on non-OK responses; pages catch or ignore silently
- Streak update failures in `progressSync.js` are caught and logged but do not fail the progress save
- Offline sync errors in `useProgress.js` are silently swallowed — retry next session

## Cross-Cutting Concerns

**Logging:** `console.error('[Tag]', message)` pattern on server; no structured logging framework

**Validation:**
- Server: ad-hoc checks in route handlers (e.g., regex PIN validation in `routes/auth.js`)
- Client: no form library; validation is inline or absent

**Authentication:**
- All `/api/*` routes except `kid-lookup` and `kid-login` require `requireAuth` middleware
- `ProtectedRoute` enforces role guards client-side: `requireRole="teacher"`, `requireRole="parent"`, `requireKid`
- Kid PIN flows use bcrypt (salt 10) for storage, custom JWT (8h expiry) for sessions

---

*Architecture analysis: 2026-03-18*
