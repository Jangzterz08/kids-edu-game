# Phase 7: Analytics & Observability - Research

**Researched:** 2026-03-21
**Domain:** Sentry SDK (React + Node/Express), Recharts, Prisma sessions table, game viewport CSS, parent/teacher dashboard analytics
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Game Viewport Fit (cross-cutting):**
- All 8 game components in `client/src/components/games/` must fit within `100dvh` — no vertical scroll during gameplay
- CSS approach: `height: 100dvh` on game wrapper, `overflow: hidden`. Inner content uses flex with proportional sizing. Only the answer-choice list may scroll internally (`overflow-y: auto`).
- Header + progress bar combined: max `56px`, so game content gets `calc(100dvh - 56px)`
- Test breakpoints: 375×667 (iPhone SE), 390×844 (iPhone 14), 768×1024 (iPad), 1280×800 (laptop)

**Sentry Error Tracking (OBS-01):**
- Client: `@sentry/react` — init in `client/src/main.jsx` before React mounts. DSN from `VITE_SENTRY_DSN`.
- Server: `@sentry/node` — init in `server/src/index.js` as the very first import/require, before express and routes. DSN from `SENTRY_DSN`.
- Environment tagging: `import.meta.env.MODE` (client) / `process.env.NODE_ENV` (server). Suppress in development.
- Error boundary: Wrap existing `<ErrorBoundary>` with `Sentry.ErrorBoundary` — do not replace Phase 2's fallback UI.
- Unhandled rejections: Server must register `process.on('unhandledRejection', ...)` forwarding to Sentry.
- Source maps: Upload via `@sentry/vite-plugin` during build. Auth token from `SENTRY_AUTH_TOKEN`.

**Parent Analytics Dashboard (OBS-02):**
- Route: `/parent/analytics` — accessible from parent dashboard nav
- Metrics: daily minutes (bar chart, one bar per day), per-module star trend (bar per module, avg stars 7 days)
- API: `GET /api/parent/analytics/:childId?period=7d` → `{ dailyMinutes: [{date, minutes}], moduleStars: [{slug, avgStars}] }`
- Charting: `recharts` — locked, no Chart.js or D3
- Session tracking: new `sessions` table; client heartbeat `POST /api/sessions/heartbeat` every 60s
- Privacy: parent can only query own children (JWT sub claim check)

**Teacher Analytics View (OBS-03):**
- Route: `/teacher/classroom/:classroomId/analytics` — from classroom detail page
- View: table — rows = students, columns = modules. Cell shows avg stars (0–3) with color: `≥2.5` green, `1–2.4` yellow, `<1` red
- "Struggling" threshold: `avgStars < 1.5` AND `attempts ≥ 2` → red cell + ⚠ indicator
- API: `GET /api/teacher/classroom/:id/analytics` → `{ students, modules, matrix: [{studentId, moduleSlug, avgStars, attempts}] }`
- Only teacher's own classrooms — enforced by classroom membership check

### Claude's Discretion

- Exact DB schema for `sessions` table (columns, indexes)
- Sentry DSN provisioning steps — document in `.env.example`
- Recharts component variant (BarChart vs LineChart) for time-in-app — pick legibility
- Whether heartbeat endpoint uses dedicated sessions route or piggybacks on existing activity endpoint

### Deferred Ideas (OUT OF SCOPE)

- Real-time analytics (websocket push)
- Export analytics to CSV
- Admin-level analytics across all users
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OBS-01 | Sentry SDK integrated on client (`@sentry/react`) and server (`@sentry/node`) with DSN via env vars | Sentry 10.x init patterns, vite-plugin source map upload, Express handler ordering documented below |
| OBS-02 | Parent dashboard enhanced with time-on-app chart, lessons-per-day histogram, per-module star trends | Recharts BarChart API, sessions table schema, heartbeat endpoint pattern documented below |
| OBS-03 | Teacher dashboard enhanced with class-level performance metrics: avg stars per module, completion rates, struggling kids flagged | Analytics endpoint shape derived from existing Prisma schema (LessonProgress + ClassroomStudent joins) documented below |
</phase_requirements>

---

## Summary

Phase 7 adds three independent capabilities to a fully deployed React + Vite / Express + Prisma stack: Sentry error capture on both ends, a parent analytics page with session-time and module-star charts using recharts, and a teacher classroom analytics matrix identifying struggling students. A fourth cross-cutting concern — game viewport overflow on mobile — must be addressed as a separate plan to avoid interleaving layout changes with analytics logic.

The existing codebase is CJS on the server (`"type": "commonjs"`) and ESM on the client (`"type": "module"`). This distinction critically affects Sentry initialization: `@sentry/node` must be `require()`d as the very first statement in `server/src/index.js`, before Express and route requires. On the client, `Sentry.init()` must appear at the top of `client/src/main.jsx` before `createRoot`. The existing `<ErrorBoundary>` from Phase 2 wraps the root — Sentry's `onError` callback should be added to the existing `onError` prop rather than replacing it.

The game viewport problem is a KidLayout + game component layout issue: `KidLayout` uses `minHeight: '100vh'` on its container and `flex: 1` on `<main>`, which allows the page to grow beyond the viewport. Game components use `padding: var(--space-xl)` containers with no height constraint, so content overflows on small screens. The fix is to change the `KidLayout` container to `height: 100dvh; overflow: hidden`, give `<main>` `overflow-y: auto; height: calc(100dvh - 72px)` (header is currently 72px, target is 56px per CONTEXT.md), and let game components fill the available space with flex layout.

**Primary recommendation:** Plan this phase as 4 sequential plans: (P1) game viewport fix, (P2) Sentry client+server, (P3) sessions table + heartbeat + parent analytics, (P4) teacher classroom analytics. This keeps each plan focused and verifiable.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/react | 10.45.0 | React error boundary, unhandled rejection capture, source context | Official Sentry SDK for React; integrates with ErrorBoundary |
| @sentry/node | 10.45.0 | Express request capture, unhandled rejection forwarding | Official Sentry SDK for Node.js/Express |
| @sentry/vite-plugin | 5.1.1 | Source map upload to Sentry during `vite build` | Required to get readable stack traces in Sentry dashboard |
| recharts | 3.8.0 | BarChart for daily minutes, small bars for module stars | Locked decision; composable, no D3 peer dep |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (no additional installs) | — | Sessions table uses Prisma (already installed) | Heartbeat uses existing Express + Prisma |

**Installation:**

```bash
# Client
cd client
npm install @sentry/react recharts
npm install -D @sentry/vite-plugin

# Server
cd server
npm install @sentry/node
```

**Version verification (confirmed 2026-03-21 against npm registry):**
- `@sentry/react` 10.45.0
- `@sentry/node` 10.45.0
- `@sentry/vite-plugin` 5.1.1
- `recharts` 3.8.0

---

## Architecture Patterns

### Recommended Project Structure

New files this phase adds to the existing tree:

```
client/src/
├── pages/
│   └── ParentAnalytics.jsx        # OBS-02: new analytics page
├── components/
│   └── analytics/
│       ├── DailyMinutesChart.jsx  # BarChart wrapper
│       └── ModuleStarsChart.jsx   # Per-module star bars
server/src/
├── routes/
│   ├── sessions.js                # heartbeat + session management
│   └── analytics.js               # parent + teacher analytics endpoints
prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_add_sessions/
        └── migration.sql          # Session model migration
```

### Pattern 1: Sentry Client Init (CJS-safe, Vite+React)

**What:** Sentry must be initialized before any React code runs — before `createRoot`. In Vite's ESM build, side-effect imports at the top of `main.jsx` run in order.

**When to use:** Always — this is the required order per Sentry docs.

**Current `main.jsx` structure:**
```javascript
// client/src/main.jsx  — CURRENT (no Sentry)
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import ErrorFallback from './components/ui/ErrorFallback';
import App from './App.jsx';
import './index.css';
```

**After adding Sentry (Sentry init must be first import):**
```javascript
// client/src/main.jsx  — AFTER Phase 7
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import ErrorFallback from './components/ui/ErrorFallback';
import App from './App.jsx';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.MODE !== 'development',
  tracesSampleRate: 0.1,
  integrations: [Sentry.browserTracingIntegration()],
});

createRoot(document.getElementById('root')).render(
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      console.error('[ErrorBoundary]', error, info);
      Sentry.captureException(error, { extra: info });  // add this line
    }}
    onReset={() => window.location.assign('/')}
  >
    <App />
    <Toaster position="top-center" richColors />
  </ErrorBoundary>
);
```

**Key insight:** Do NOT replace `<ErrorBoundary>` with `<Sentry.ErrorBoundary>` — the Phase 2 fallback UI lives on the existing component. Instead, forward the error to Sentry inside the existing `onError` prop.

### Pattern 2: Sentry Server Init (CJS, Express)

**What:** `@sentry/node` must be the first `require()` call in the server entry point — before dotenv, express, or any route file that could trigger an error.

**Critical ordering in `server/src/index.js`:**
```javascript
// server/src/index.js  — FIRST TWO LINES (before anything else)
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  integrations: [Sentry.expressIntegration()],
});

// THEN existing code follows
require('dotenv').config();
const express = require('express');
// ... rest of existing index.js
```

**Unhandled rejection forwarding (add before `app.listen`):**
```javascript
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
});
```

**Express error handler — Sentry must come BEFORE the existing error handler:**
```javascript
// Add Sentry error handler before the existing error handler
app.use(Sentry.expressErrorHandler());

// Existing error handler (keep as-is)
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ ... });
});
```

### Pattern 3: Source Maps via @sentry/vite-plugin

**What:** The vite plugin uploads source maps to Sentry at build time so production error stack traces show original source lines.

**`vite.config.js` after adding Sentry plugin:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true,  // required — enable source maps for upload
  },
  plugins: [
    react(),
    VitePWA({ /* existing config unchanged */ }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
```

**Build env vars required (set in CI / local build):**
- `SENTRY_AUTH_TOKEN` — from Sentry org settings → API keys
- `SENTRY_ORG` — the Sentry organization slug
- `SENTRY_PROJECT` — the Sentry project slug

**Critical:** `build.sourcemap: true` must be set; the plugin reads generated source maps and uploads them, then optionally deletes them from the output (default behavior preserves them unless `sourcemaps.filesToDeleteAfterUpload` is configured).

### Pattern 4: CSP — Sentry Needs connect-src Expansion

**What:** The existing `vercel.json` CSP restricts `connect-src`. Sentry's browser SDK sends events to `https://o*.ingest.sentry.io`. This domain must be added or the SDK will silently fail to send events.

**Current CSP connect-src:**
```
connect-src 'self' https://*.supabase.co https://kids-edu-game-production.up.railway.app
```

**Required addition:**
```
connect-src 'self' https://*.supabase.co https://kids-edu-game-production.up.railway.app https://*.ingest.sentry.io
```

The pattern `https://*.ingest.sentry.io` covers all Sentry ingest endpoints regardless of org region (US, EU).

### Pattern 5: Sessions Table Schema (Claude's Discretion)

**What:** New `Session` model in `prisma/schema.prisma` for tracking time-in-app. Heartbeat-based approach: client POSTs `/api/sessions/heartbeat` every 60s with the active session ID. Server writes start/end timestamps.

**Recommended schema:**
```prisma
model Session {
  id        String     @id @default(uuid())
  kidId     String
  kid       KidProfile @relation(fields: [kidId], references: [id], onDelete: Cascade)
  startedAt DateTime   @default(now())
  endedAt   DateTime?
  lastHeartbeatAt DateTime @default(now())

  @@index([kidId, startedAt])  // analytics query scans by kidId + date range
}
```

**Why this schema:**
- `startedAt` + `lastHeartbeatAt`: if client disconnects without closing, `lastHeartbeatAt` serves as effective end time (sessions older than 2 minutes with no heartbeat are considered ended)
- `endedAt` is set explicitly on graceful close (beforeunload event), but is `null` for crash/disconnect scenarios
- `@@index([kidId, startedAt])` directly supports the analytics query `WHERE kidId = ? AND startedAt >= ?`

**Effective duration computation:** `COALESCE(endedAt, lastHeartbeatAt) - startedAt` in minutes

**Heartbeat endpoint (sessions route):**
```javascript
// POST /api/sessions/heartbeat
// Body: { sessionId? }  — if null, creates new session
// Returns: { sessionId }
```

Client calls on mount (creates session), then setInterval(60000) for heartbeat, then on unmount sends `endedAt`.

**Existing KidProfile model** already has `@relation` fields for progress, achievements, classrooms, moduleDifficulties, reviewSchedules, dailyChallenges — adding `sessions Session[]` follows the same pattern.

### Pattern 6: Parent Analytics API Response Shape

**What:** `GET /api/parent/analytics/:childId?period=7d` — server-side aggregation of session time + module stars.

**Daily minutes query approach:**
```javascript
// Prisma raw-ish: group sessions by date bucket
// Use $queryRaw or group by date_trunc in PostgreSQL
// Aggregate: SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_heartbeat_at) - started_at))/60)
// Group by: date_trunc('day', started_at)
```

**Module stars query approach:**
```javascript
// LessonProgress → join Module (via Lesson) → avg starsEarned by moduleSlug
// Prisma: group by Lesson.moduleId, then join Module for slug
// Or: prisma.lessonProgress.findMany({ where: { kidId, updatedAt >= cutoff } }) then aggregate in JS
```

For the 7-day window with 13 modules and a typical number of lessons, in-JS aggregation after a single Prisma `findMany` is simpler and avoids `$queryRaw`. The dataset is small enough (13 modules × max ~9 lessons each = 117 max rows per kid).

**Response shape:**
```json
{
  "dailyMinutes": [
    { "date": "2026-03-15", "minutes": 12 },
    { "date": "2026-03-16", "minutes": 0 },
    ...7 entries
  ],
  "moduleStars": [
    { "slug": "animals", "name": "Animals", "avgStars": 2.5 },
    { "slug": "colors", "name": "Colors", "avgStars": 1.8 },
    ...
  ]
}
```

**Privacy enforcement:** Server resolves `req.user.id` → `prisma.user.findUnique` → checks `kids.some(k => k.id === childId)`. Returns 403 if childId not owned by authenticated parent.

### Pattern 7: Teacher Analytics API Response Shape

**What:** `GET /api/teacher/classroom/:id/analytics` — matrix of student × module performance.

**Authorization check:** Classroom must belong to the authenticated teacher. Existing pattern from `classrooms.js` route: `prisma.classroom.findFirst({ where: { id, teacherId: dbUser.id } })`.

**Data fetch approach:**
1. Fetch all `ClassroomStudent` records for the classroom (with `kid` nested)
2. Fetch all `LessonProgress` for those kids, joining `Lesson` for `moduleSlug`
3. In JS: group by `(kidId, moduleSlug)` → compute `avgStars = sum(starsEarned) / count`, `attempts = sum(attempts)`

**Response shape:**
```json
{
  "students": [{ "id": "...", "name": "Alice", "avatarId": "fish" }],
  "modules": [{ "slug": "animals", "name": "Animals" }],
  "matrix": [
    { "studentId": "...", "moduleSlug": "animals", "avgStars": 1.2, "attempts": 3 }
  ]
}
```

**Struggling flag:** Computed client-side from the matrix (`avgStars < 1.5 && attempts >= 2`) — no need to encode it server-side, the client renders the color and ⚠ indicator.

### Pattern 8: Recharts Usage

**BarChart for daily minutes (OBS-02):**
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// data: [{ date: '2026-03-15', minutes: 12 }, ...]
<ResponsiveContainer width="100%" height={200}>
  <BarChart data={dailyMinutes}>
    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
    <YAxis unit=" min" />
    <Tooltip />
    <Bar dataKey="minutes" fill="var(--primary)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

**Bar chart for module stars (OBS-02) — horizontal BarChart is more legible for 13 named modules:**
```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// data: [{ slug: 'animals', name: 'Animals', avgStars: 2.5 }, ...]
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={moduleStars} layout="vertical">
    <XAxis type="number" domain={[0, 3]} ticks={[0, 1, 2, 3]} />
    <YAxis type="category" dataKey="name" width={80} />
    <Tooltip />
    <Bar dataKey="avgStars" radius={[0, 4, 4, 0]}>
      {moduleStars.map((entry) => (
        <Cell
          key={entry.slug}
          fill={entry.avgStars >= 2.5 ? 'var(--green)' : entry.avgStars >= 1 ? 'var(--yellow)' : 'var(--accent-red)'}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

**Teacher analytics — plain HTML table (no recharts needed):** The matrix is a standard `<table>` where cell background is set via inline style based on `avgStars` and the struggling threshold. Recharts is not needed for the teacher view.

### Pattern 9: Game Viewport Fix

**Root cause:** `KidLayout` container uses `minHeight: '100vh'` (allows growth beyond viewport). `<main>` uses `flex: 1` (grows with content). Game components use `padding`-only containers with no height limit — content overflows on 375px-height screens.

**KidLayout fix:**
```javascript
// styles.container — change from:
container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }
// to:
container: { height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }

// styles.header — keep at height: 72 (existing) or reduce to 56 per CONTEXT.md target
// CONTEXT.md says max 56px for header + progress; current header is 72px
// Decision: reduce KidLayout header to 56px height

// styles.main — change from:
main: { flex: 1, position: 'relative', zIndex: 1 }
// to:
main: { flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }
```

**Per-game-component fix (same pattern for all 8):**
```javascript
// Each game component's root container — change from padding-only:
container: { padding: 'var(--space-xl)', maxWidth: 600, margin: '0 auto', position: 'relative' }
// to flex fill:
container: {
  flex: 1, display: 'flex', flexDirection: 'column',
  padding: '12px var(--space-md)',   // reduced vertical padding
  maxWidth: 600, margin: '0 auto', width: '100%',
  overflow: 'hidden',
}
```

**Answer grid / choice list:** Keep `overflow-y: auto` on the scrollable answer container to allow scrolling within the bounded game area.

**MiniGame.jsx wrapper:** Currently `<div>` with no height constraint. Must become:
```javascript
// return (
//   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
```

**KidLayout header height reduction (56px target):** Current header is `height: 72`. The game header in `MiniGame.jsx` (`styles.gameHeader`) is an additional element inside `<main>` — it is NOT part of KidLayout's `<header>`. So the available space for game content is `100dvh - 72px` (KidLayout header) minus the MiniGame game-header (~56-70px internal). Both must be accounted for.

**Revised calculation:** KidLayout header = 56px (reduced from 72px). MiniGame internal game-header = keep as-is but constrain its height. Game component content area = `calc(100dvh - 56px - [internal header height])`.

### Anti-Patterns to Avoid

- **Do NOT** initialize Sentry after `require('express')` or any route file on the server — errors thrown during module load will be missed.
- **Do NOT** use `Sentry.ErrorBoundary` as a replacement for Phase 2's `<ErrorBoundary>` — use the `onError` callback bridge pattern instead.
- **Do NOT** use `100vh` for the game viewport — use `100dvh`. On iOS Safari, `100vh` does not account for the dynamic address bar height.
- **Do NOT** compute session duration from `endedAt` only — sessions that crash have null `endedAt`; always fall back to `lastHeartbeatAt`.
- **Do NOT** trust `process.env.SENTRY_DSN` on the client — Vite strips non-`VITE_`-prefixed env vars from client builds.
- **Do NOT** add `SENTRY_AUTH_TOKEN` to `VITE_*` env vars — the auth token is for build-time upload only and must never ship to the browser.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error capture + stack enrichment | Custom try/catch wrappers everywhere | `@sentry/react` + `@sentry/node` | Source maps, breadcrumbs, environment context, release tracking — months of work |
| Source map upload to error tracker | Manual file upload scripts | `@sentry/vite-plugin` | Handles build hash, source map association, cleanup automatically |
| Bar charts with responsive sizing | Raw SVG / canvas drawing | `recharts` `<ResponsiveContainer>` | Handles resize, tooltip, axis formatting |
| Session time computation | Browser timestamp diff sent from client | Server-side from `lastHeartbeatAt` | Client timestamps are untrustworthy; server controls the time |

---

## Common Pitfalls

### Pitfall 1: Sentry Init Order on CJS Server

**What goes wrong:** `@sentry/node` is required after Express is initialized. Express route modules that throw on load (e.g., missing env var) are not captured.

**Why it happens:** CJS `require()` is synchronous — the module resolution graph executes before Sentry is active unless Sentry is required first.

**How to avoid:** `const Sentry = require('@sentry/node')` and `Sentry.init({...})` must be the first two statements in `server/src/index.js` — before `require('dotenv')`.

**Warning signs:** Errors appear in Railway logs but not in Sentry. Sentry dashboard shows no events from server.

### Pitfall 2: CSP Blocking Sentry Events

**What goes wrong:** Client SDK silently fails to send events. Sentry dashboard is empty despite client errors occurring.

**Why it happens:** `vercel.json` CSP `connect-src` does not include `https://*.ingest.sentry.io`.

**How to avoid:** Add `https://*.ingest.sentry.io` to `connect-src` in `client/vercel.json`.

**Warning signs:** Browser DevTools console shows a CSP violation for `o*.ingest.sentry.io`. Sentry shows no client errors even though the app crashes.

### Pitfall 3: VITE_SENTRY_DSN Missing in Vercel Deploy

**What goes wrong:** `Sentry.init()` receives `undefined` DSN. SDK initializes but sends nothing — no error, just silence.

**Why it happens:** Vite strips `import.meta.env.*` at build time. If `VITE_SENTRY_DSN` is not set in the Vercel project env vars before deploying, the built bundle has `undefined` hardcoded.

**How to avoid:** Set `VITE_SENTRY_DSN` in Vercel project settings before running a production build. Check with `import.meta.env.VITE_SENTRY_DSN` at app startup (log if undefined in non-production).

**Warning signs:** `Sentry.init` receives no DSN error but no events appear in dashboard.

### Pitfall 4: Heartbeat Interval Survives Component Unmount

**What goes wrong:** `setInterval` for the heartbeat runs after the component unmounts, causing React state updates on an unmounted component and unnecessary API calls.

**Why it happens:** `setInterval` is not cleared in a `useEffect` cleanup function.

**How to avoid:** Return a cleanup function from `useEffect` that calls `clearInterval` and sends a final `endedAt` update:
```javascript
useEffect(() => {
  const sessionId = await api.post('/api/sessions/heartbeat', {});  // creates session
  const timer = setInterval(() => api.post('/api/sessions/heartbeat', { sessionId }), 60_000);
  return () => {
    clearInterval(timer);
    api.post('/api/sessions/end', { sessionId });  // graceful end
  };
}, []);
```

**Warning signs:** Sessions accumulate in the DB with no `endedAt` and recent `lastHeartbeatAt` long after the user left.

### Pitfall 5: Analytics Endpoint Exposes Other Parents' Children

**What goes wrong:** `GET /api/parent/analytics/:childId` returns data for any valid childId, not just the requesting parent's children.

**Why it happens:** Route only validates the JWT is valid, not that the child belongs to the authenticated user.

**How to avoid:** After resolving `req.user.id` to a `dbUser`, query `prisma.kidProfile.findFirst({ where: { id: childId, parentId: dbUser.id } })` and return 403 if null.

**Warning signs:** Test with a valid JWT for Parent A and request Parent B's childId — currently returns data.

### Pitfall 6: Game Viewport Uses 100vh Instead of 100dvh

**What goes wrong:** On iOS Safari with the dynamic address bar, `100vh` equals the viewport height INCLUDING the retracted address bar. When the bar is visible, game content is clipped or scrolls.

**Why it happens:** `100vh` in iOS Safari has historically been the "maximum" viewport height. `100dvh` is the actual current viewport height accounting for browser chrome.

**How to avoid:** Use `100dvh` in KidLayout container and all game-related height calculations. Verified supported on iOS 15+, Android Chrome 108+, all modern desktop browsers.

**Warning signs:** Game cards are cut off at the bottom on iPhone SE in portrait mode.

### Pitfall 7: Recharts ResponsiveContainer Needs Explicit Parent Height

**What goes wrong:** `<ResponsiveContainer height={200}>` renders at 0px height inside a flex container with no explicit height on the parent.

**Why it happens:** Recharts `ResponsiveContainer` measures its parent DOM node. If the parent has `height: auto` in a flex context, the measured height can be 0.

**How to avoid:** Wrap `<ResponsiveContainer>` in a `<div style={{ height: 200 }}>` explicitly, or ensure the parent has a resolved height. Do not rely solely on the `height` prop of `ResponsiveContainer` alone in flex layouts.

---

## Code Examples

### Sentry.init (client)

```javascript
// Source: Sentry React SDK docs, @sentry/react 10.x
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.MODE !== 'development',
  tracesSampleRate: 0.1,   // capture 10% of traces — not all
  integrations: [Sentry.browserTracingIntegration()],
});
```

### Sentry.init (server CJS)

```javascript
// Source: Sentry Node.js SDK docs, @sentry/node 10.x
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  integrations: [Sentry.expressIntegration()],
});

// Required: unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  Sentry.captureException(reason);
});
```

### sentryVitePlugin in vite.config.js

```javascript
// Source: @sentry/vite-plugin 5.x docs
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: { sourcemap: true },
  plugins: [
    react(),
    VitePWA({ /* unchanged */ }),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### Sessions Prisma Migration

```prisma
// Add to server/prisma/schema.prisma

model Session {
  id              String     @id @default(uuid())
  kidId           String
  kid             KidProfile @relation(fields: [kidId], references: [id], onDelete: Cascade)
  startedAt       DateTime   @default(now())
  endedAt         DateTime?
  lastHeartbeatAt DateTime   @default(now())

  @@index([kidId, startedAt])
}
```

Also add `sessions Session[]` to the `KidProfile` model relation list.

### Heartbeat Route (Express CJS)

```javascript
// server/src/routes/sessions.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// POST /api/sessions/heartbeat
// Body: { sessionId?: string }
router.post('/heartbeat', async (req, res, next) => {
  try {
    if (req.user.type !== 'kid') return res.status(403).json({ error: 'Kids only' });
    const { sessionId } = req.body;

    if (!sessionId) {
      // Create new session
      const session = await prisma.session.create({
        data: { kidId: req.user.id },
      });
      return res.json({ sessionId: session.id });
    }

    // Update heartbeat on existing session
    await prisma.session.updateMany({
      where: { id: sessionId, kidId: req.user.id },
      data: { lastHeartbeatAt: new Date() },
    });
    res.json({ sessionId });
  } catch (err) { next(err); }
});

// POST /api/sessions/end
router.post('/end', async (req, res, next) => {
  try {
    if (req.user.type !== 'kid') return res.status(403).json({ error: 'Kids only' });
    const { sessionId } = req.body;
    await prisma.session.updateMany({
      where: { id: sessionId, kidId: req.user.id },
      data: { endedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

### Parent Analytics Endpoint

```javascript
// server/src/routes/analytics.js  (partial)
router.get('/parent/:childId', async (req, res, next) => {
  try {
    const { childId } = req.params;
    const period = req.query.period === '30d' ? 30 : 7;

    // Auth: verify child belongs to parent
    const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id }, include: { kids: { select: { id: true } } } });
    if (!dbUser || !dbUser.kids.some(k => k.id === childId)) {
      return res.status(403).json({ error: 'Not your child' });
    }

    const cutoff = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // Fetch sessions
    const sessions = await prisma.session.findMany({
      where: { kidId: childId, startedAt: { gte: cutoff } },
    });

    // Aggregate daily minutes
    const minutesByDay = {};
    for (let i = 0; i < period; i++) {
      const d = new Date(cutoff); d.setDate(d.getDate() + i);
      minutesByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const s of sessions) {
      const day = s.startedAt.toISOString().slice(0, 10);
      const endMs = (s.endedAt || s.lastHeartbeatAt).getTime();
      const mins = Math.round((endMs - s.startedAt.getTime()) / 60_000);
      if (minutesByDay[day] !== undefined) minutesByDay[day] += Math.max(0, mins);
    }

    // Fetch progress for module stars
    const progress = await prisma.lessonProgress.findMany({
      where: { kidId: childId, updatedAt: { gte: cutoff } },
      include: { lesson: { include: { module: true } } },
    });

    // Aggregate module stars
    const moduleAgg = {};
    for (const p of progress) {
      const slug = p.lesson.module.slug;
      const name = p.lesson.module.title;
      if (!moduleAgg[slug]) moduleAgg[slug] = { slug, name, total: 0, count: 0 };
      moduleAgg[slug].total += p.starsEarned;
      moduleAgg[slug].count++;
    }

    res.json({
      dailyMinutes: Object.entries(minutesByDay).map(([date, minutes]) => ({ date, minutes })),
      moduleStars: Object.values(moduleAgg).map(m => ({
        slug: m.slug, name: m.name,
        avgStars: m.count > 0 ? Math.round((m.total / m.count) * 10) / 10 : 0,
      })),
    });
  } catch (err) { next(err); }
});
```

### Teacher Analytics Endpoint

```javascript
// server/src/routes/analytics.js  (partial)
router.get('/teacher/classroom/:id', async (req, res, next) => {
  try {
    const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
    if (!dbUser || dbUser.role !== 'teacher') return res.status(403).json({ error: 'Teachers only' });

    const classroom = await prisma.classroom.findFirst({ where: { id: req.params.id, teacherId: dbUser.id } });
    if (!classroom) return res.status(403).json({ error: 'Not your classroom' });

    const enrollments = await prisma.classroomStudent.findMany({
      where: { classroomId: classroom.id },
      include: { kid: { select: { id: true, name: true, avatarId: true } } },
    });
    const kidIds = enrollments.map(e => e.kidId);

    const progress = await prisma.lessonProgress.findMany({
      where: { kidId: { in: kidIds } },
      include: { lesson: { include: { module: true } } },
    });

    // Build matrix
    const matrix = {};
    for (const p of progress) {
      const slug = p.lesson.module.slug;
      const key = `${p.kidId}::${slug}`;
      if (!matrix[key]) matrix[key] = { studentId: p.kidId, moduleSlug: slug, total: 0, count: 0, attempts: 0 };
      matrix[key].total += p.starsEarned;
      matrix[key].count++;
      matrix[key].attempts += p.attempts;
    }

    // Collect unique modules
    const modulesMap = {};
    for (const p of progress) {
      const m = p.lesson.module;
      modulesMap[m.slug] = { slug: m.slug, name: m.title };
    }

    res.json({
      students: enrollments.map(e => e.kid),
      modules: Object.values(modulesMap),
      matrix: Object.values(matrix).map(m => ({
        studentId: m.studentId,
        moduleSlug: m.moduleSlug,
        avgStars: m.count > 0 ? Math.round((m.total / m.count) * 10) / 10 : 0,
        attempts: m.attempts,
      })),
    });
  } catch (err) { next(err); }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Sentry.Handlers.requestHandler()` / `errorHandler()` | `Sentry.expressIntegration()` in `Sentry.init` | Sentry SDK v8+ | Old handler pattern removed; new integration-based approach is required for @sentry/node 10.x |
| `100vh` for full-screen layouts | `100dvh` | CSS Values 4 / 2022 browsers | `100dvh` correctly handles iOS Safari dynamic address bar |
| Recharts v2 (recharts@2.x) | Recharts v3 (3.8.0) | Late 2024 | API is largely compatible; v3 adds React 19 support, improved TypeScript types |

**Deprecated/outdated:**
- `Sentry.Handlers.requestHandler()` and `Sentry.Handlers.errorHandler()`: removed in @sentry/node 8+. Use `Sentry.expressIntegration()` instead.
- `Sentry.configureScope()`: deprecated. Use `Sentry.withScope()` or `Sentry.setUser()` at the call site.

---

## Open Questions

1. **Header height: 72px vs 56px**
   - What we know: KidLayout header currently `height: 72`. CONTEXT.md says max 56px for header + progress bar combined.
   - What's unclear: MiniGame has a separate internal game-header element inside `<main>`. Does the 56px limit apply to KidLayout's `<header>` only, or to KidLayout header + MiniGame header combined?
   - Recommendation: Treat the 56px limit as the KidLayout `<header>` height (reduce from 72 to 56). The MiniGame internal header is inside `<main>`, which has `overflow: hidden` — so it consumes space from the available `calc(100dvh - 56px)`. The game component must account for both.

2. **Heartbeat on KidHome vs MiniGame only**
   - What we know: Session tracking measures time-in-app broadly.
   - What's unclear: Should heartbeat start on the `/play` (KidHome) page or only during active gameplay in MiniGame?
   - Recommendation: Start session on KidHome mount (first page after kid selects profile), heartbeat throughout kid routes. This captures all time-in-app, not just game time, which matches the requirement "time spent in the app this week."

3. **recharts `<ResponsiveContainer>` and Vercel CSP `script-src`**
   - What we know: recharts uses inline SVG — no dynamic script injection.
   - What's unclear: recharts uses some internal `eval`-like patterns in older versions.
   - Recommendation: recharts 3.x is pure React SVG — no `eval`, no dynamic script. The existing `'unsafe-inline'` in `script-src` is sufficient.

---

## Validation Architecture

nyquist_validation is enabled (config.json does not set it to false).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (server) — no client test setup |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd server && npx vitest run tests/analytics/` |
| Full suite command | `cd server && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-01 (Sentry client) | `Sentry.init` called with `VITE_SENTRY_DSN`; `onError` forwarded | manual smoke | Check browser Network tab for `https://*.ingest.sentry.io` request | ❌ manual |
| OBS-01 (Sentry server) | `Sentry.captureException` called on unhandled rejection | unit | `cd server && npx vitest run tests/observability/obs01-sentry.test.js` | ❌ Wave 0 |
| OBS-01 (error handler order) | Express error handler chain includes Sentry handler before custom handler | unit | same file | ❌ Wave 0 |
| OBS-02 (heartbeat) | `POST /api/sessions/heartbeat` creates Session row; updates `lastHeartbeatAt`; enforces kid-auth-only | unit | `cd server && npx vitest run tests/observability/obs02-sessions.test.js` | ❌ Wave 0 |
| OBS-02 (analytics endpoint) | `GET /api/parent/analytics/:childId` returns `dailyMinutes` array length = period; `moduleStars` array; 403 for non-owned child | unit | `cd server && npx vitest run tests/observability/obs02-analytics.test.js` | ❌ Wave 0 |
| OBS-03 (teacher endpoint) | `GET /api/teacher/classroom/:id/analytics` returns `students`, `modules`, `matrix`; 403 for non-owned classroom | unit | `cd server && npx vitest run tests/observability/obs03-analytics.test.js` | ❌ Wave 0 |
| Game viewport fit | All 8 games visible without scroll at 375px height | manual | Open DevTools → Responsive → 375×667 → verify no scrollbar on `/play/:slug/game` | manual |

### Sampling Rate

- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/observability/`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run`
- **Phase gate:** Full server suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/observability/obs01-sentry.test.js` — covers OBS-01 server init + capture
- [ ] `server/tests/observability/obs02-sessions.test.js` — covers heartbeat endpoint (create, update, auth)
- [ ] `server/tests/observability/obs02-analytics.test.js` — covers parent analytics endpoint (data shape, auth, period filter)
- [ ] `server/tests/observability/obs03-analytics.test.js` — covers teacher analytics endpoint (matrix shape, auth, classroom ownership)

**Test pattern follows established project pattern** (see `server/tests/security/sec01-price-validation.test.js`): set env vars → import app → use supertest → vi.spyOn(global.prisma) for DB calls.

---

## Sources

### Primary (HIGH confidence)

- Sentry React SDK docs (verified via npm registry + official docs) — init pattern, ErrorBoundary bridge, `enabled` flag, `tracesSampleRate`
- `@sentry/vite-plugin` README — `sentryVitePlugin()` config, `build.sourcemap: true` requirement
- Recharts 3.x docs — `ResponsiveContainer`, `BarChart`, `Cell` for per-bar coloring, `layout="vertical"` for horizontal bar charts
- Codebase direct inspection — KidLayout styles, MiniGame styles, QuizGame container styles, vercel.json CSP, server/src/index.js structure, prisma/schema.prisma full model set, client/package.json, server/package.json

### Secondary (MEDIUM confidence)

- `100dvh` browser support — MDN CSS Values 4 spec, widely supported iOS 15.4+ / Chrome 108+ / Firefox 116+
- Sentry Express handler ordering for @sentry/node 10.x — docs state `expressIntegration()` replaces old `Handlers.*` pattern

### Tertiary (LOW confidence)

- None — all critical claims verified against official sources or direct codebase inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed against npm registry (2026-03-21)
- Sentry integration patterns: HIGH — verified against @sentry/node 10.x and @sentry/react 10.x API; old handler deprecation confirmed
- Architecture (sessions schema, analytics endpoints): HIGH — derived directly from existing Prisma schema and established route patterns in codebase
- Recharts patterns: HIGH — derived from recharts 3.x API, confirmed against npm-current version
- Game viewport fix: HIGH — root cause confirmed by reading KidLayout styles (`minHeight: 100vh`, header `height: 72`), game component containers (`padding` only, no height constraint)
- CSP Sentry domain: HIGH — Sentry ingest domain `*.ingest.sentry.io` is documented and stable

**Research date:** 2026-03-21
**Valid until:** 2026-04-20 (stable libraries; re-verify if Sentry releases a major version bump)
