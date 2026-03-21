# Phase 7: Analytics & Observability - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning
**Source:** User design session

<domain>
## Phase Boundary

Phase 7 delivers two capabilities:

1. **Error observability** — Sentry integration on both client and server so unhandled exceptions are captured automatically with full stack traces. Zero silent failures.
2. **Learning analytics dashboards** — Parents see time-in-app and per-module progress charts. Teachers see a classroom view identifying struggling students per module.

Additionally, this phase addresses a long-standing UX issue: **the game view must fit within the viewport without scrolling**. The game canvas currently requires users to scroll to see all content on smaller screens. This must be fixed so the entire game experience is self-contained within the visible screen area.

</domain>

<decisions>
## Implementation Decisions

### Game Viewport Fit (cross-cutting — applies to all game components)

**Locked decision — every game component must fit within the visible viewport without requiring scroll.**

- **Constraint:** The game area (`client/src/components/games/`) must render entirely within `100dvh` (dynamic viewport height, preferred over `100vh` to account for mobile browser chrome). No vertical scroll permitted during active gameplay.
- **Approach:** Use CSS `height: 100dvh` on the game wrapper with `overflow: hidden`. Inner content uses `flex` layout with proportional sizing — no fixed pixel heights on game cards or question blocks.
- **Scrollable areas within game:** Only the answer-choice list may scroll internally (using `overflow-y: auto` on its container) if choices overflow — the game frame itself never scrolls.
- **Affected components:** All 8 game types in `client/src/components/games/` — `MatchingGame.jsx`, `OddOneOutGame.jsx`, `PatternGame.jsx`, `PhonicsGame.jsx`, `QuizGame.jsx`, `SpellingGame.jsx`, `TracingGame.jsx`, `WordScramble.jsx`.
- **Test breakpoints:** Must fit at 375×667 (iPhone SE), 390×844 (iPhone 14), 768×1024 (iPad), 1280×800 (laptop).
- **Header/progress bar:** Fixed height allocation — max `56px` for game header + progress bar combined, so game content has `calc(100dvh - 56px)` available.

### Sentry Error Tracking (OBS-01)

Locked decisions:

- **Client:** `@sentry/react` — init in `client/src/main.jsx` before React mounts. DSN from `VITE_SENTRY_DSN` env var.
- **Server:** `@sentry/node` — init in `server/index.js` as the very first import, before express and routes. DSN from `SENTRY_DSN` env var.
- **Environment tagging:** `environment: import.meta.env.MODE` (client) / `process.env.NODE_ENV` (server). Only capture in production + staging; suppress in development by checking env.
- **Error boundary integration:** Wrap the existing `<ErrorBoundary>` (from Phase 2) with `Sentry.ErrorBoundary` — do not replace Phase 2's fallback UI, add Sentry capture on top.
- **Unhandled promise rejections:** Server must register `process.on('unhandledRejection', ...)` → forward to Sentry.
- **Source maps:** Upload to Sentry during Vite build via `@sentry/vite-plugin`. Store `SENTRY_AUTH_TOKEN` in env.

### Parent Analytics Dashboard (OBS-02)

Locked decisions:

- **Route:** `/parent/analytics` — accessible from parent dashboard nav.
- **Metrics displayed:**
  - Time in app this week (minutes) — line/bar chart, one bar per day
  - Per-module star trend — sparkline or bar per module showing average stars over last 7 days
- **Data source:** New backend endpoint `GET /api/parent/analytics/:childId?period=7d` — returns `{ dailyMinutes: [{date, minutes}], moduleStars: [{slug, avgStars}] }`.
- **Charting library:** `recharts` — already widely used in React projects, no additional bundle concern. Install in `client/`.
- **Session tracking:** Time-in-app computed server-side from session start/end timestamps stored in a new `sessions` table. Client sends heartbeat `POST /api/sessions/heartbeat` every 60 seconds while active.
- **Privacy:** Parent can only query their own children (enforced by JWT sub claim check on server).

### Teacher Analytics View (OBS-03)

Locked decisions:

- **Route:** `/teacher/classroom/:classroomId/analytics` — accessible from teacher's classroom detail page.
- **View:** Table — rows = students, columns = modules. Each cell shows average stars (0–3) with color coding: `≥2.5` = green, `1–2.4` = yellow, `<1` = red.
- **"Struggling" threshold:** A student is flagged as struggling on a module when `avgStars < 1.5` AND `attempts ≥ 2`. Teacher sees this as a red cell with a ⚠ indicator.
- **Data source:** New backend endpoint `GET /api/teacher/classroom/:id/analytics` — returns `{ students: [{id, name}], modules: [{slug, name}], matrix: [{studentId, moduleSlug, avgStars, attempts}] }`.
- **Only teacher's own classrooms** accessible — enforced by classroom membership check on server.

### Claude's Discretion

- Exact DB schema for `sessions` table (columns, indexes) — implement what fits Prisma + Supabase pooler.
- Sentry DSN provisioning steps — document in `.env.example`, assume user sets up Sentry project manually.
- Recharts component variant (BarChart vs LineChart) for time-in-app — pick whichever renders more legibly at mobile viewport.
- Whether heartbeat endpoint uses a dedicated sessions route or piggybacks on an existing activity endpoint.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `.planning/STATE.md` — Project decisions and current status
- `.planning/ROADMAP.md` — Phase dependencies and requirement IDs
- `.planning/REQUIREMENTS.md` — Full requirement definitions for OBS-01, OBS-02, OBS-03

### Phase 2 Artifacts (dependency — error boundary already implemented)
- `.planning/phases/02-polish-ux/02-CONTEXT.md` — ErrorBoundary + Sentry wrapping pattern, Ollie mascot

### Existing Game Components
- `client/src/components/games/` — All 8 game type components (viewport fix applies here)
- `client/src/index.css` — Current layout CSS baseline

</canonical_refs>

<specifics>
## Specific Ideas

- Game viewport fix is a cross-cutting concern — the planner should create a dedicated plan (or task) for it, not bury it inside an analytics task.
- Sentry should be the first thing initialized on both client and server — ordering matters.
- Recharts is the preferred charting library — do not introduce Chart.js or D3 (bundle size risk).
- `100dvh` preferred over `100vh` for mobile viewport correctness.

</specifics>

<deferred>
## Deferred Ideas

- Real-time analytics (websocket push) — future phase
- Export analytics to CSV — future phase
- Admin-level analytics across all users — out of scope for Phase 7

</deferred>

---

*Phase: 07-analytics-observability*
*Context gathered: 2026-03-21*
