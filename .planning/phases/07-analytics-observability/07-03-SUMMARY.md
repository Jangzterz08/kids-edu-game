---
phase: 07-analytics-observability
plan: 03
subsystem: api, database
tags: [prisma, postgresql, sessions, analytics, express, vitest]

# Dependency graph
requires:
  - phase: 07-02
    provides: Sentry observability baseline established, test patterns for observability tests

provides:
  - Session model in Prisma schema with DB migration
  - POST /api/sessions/heartbeat — create-or-update session for kid
  - POST /api/sessions/end — mark session ended
  - GET /api/parent/analytics/parent/:childId — dailyMinutes + moduleStars with privacy enforcement
  - Test coverage: obs02-sessions.test.js, obs02-analytics.test.js (6 tests)

affects: [client-analytics-dashboard, parent-portal]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Session heartbeat pattern: client sends POST every 60 seconds; server creates new session or updates lastHeartbeatAt on existing"
    - "Parent privacy guard: prisma.kidProfile.findFirst({ where: { id: childId, parentId: dbUser.id } }) before any child data query"
    - "updateMany for session ownership check: where: { id, kidId } — if count === 0 create new session (client lost reference)"

key-files:
  created:
    - server/prisma/migrations/20260321200202_add_sessions/migration.sql
    - server/src/routes/sessions.js
    - server/src/routes/analytics.js
    - server/tests/observability/obs02-sessions.test.js
    - server/tests/observability/obs02-analytics.test.js
  modified:
    - server/prisma/schema.prisma
    - server/src/index.js

key-decisions:
  - "requireAuth added to both /api/sessions and /api/parent/analytics route registrations in index.js — routes define additional type checks (kid-only for heartbeat, parent-only for analytics) after middleware validates token"
  - "Sessions route returns 403 (not 404) for non-kid callers — distinguishes auth type mismatch from missing resource"
  - "buildDailyMinutes fills all N days from the period with 0 before adding session durations — ensures consistent-length arrays for chart rendering even on days with no activity"
  - "Session duration uses endedAt when set, falls back to lastHeartbeatAt — heartbeat-based approximate duration for incomplete sessions"
  - "Analytics test uses SUPABASE_URL='' to trigger mock user path in auth middleware (mirrors Phase 04 test pattern)"

patterns-established:
  - "Ownership guard pattern for parent analytics: user.findUnique by supabaseAuthId → kidProfile.findFirst with parentId check → 403 if null"

requirements-completed: [OBS-02]

# Metrics
duration: 18min
completed: 2026-03-21
---

# Phase 07 Plan 03: Session Tracking + Parent Analytics Summary

**Prisma Session model with heartbeat/end endpoints and parent analytics API returning per-day minutes and per-module star averages with privacy enforcement**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-21T21:00:00Z
- **Completed:** 2026-03-21T21:18:00Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments

- Prisma Session model added with kidId, startedAt, endedAt, lastHeartbeatAt fields and composite index on (kidId, startedAt)
- DB migration run against live Supabase instance (20260321200202_add_sessions)
- Heartbeat endpoint creates new session or updates lastHeartbeatAt on existing; gracefully handles lost client references
- Parent analytics endpoint returns dailyMinutes (7-day default, zero-filled) and moduleStars (avgStars per module) with parent-only privacy enforcement via kidProfile ownership check
- 6 passing tests across obs02-sessions.test.js and obs02-analytics.test.js

## Task Commits

1. **Task 1: Prisma Session model + heartbeat + analytics + tests** - `dc26129` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `server/prisma/schema.prisma` - Added Session model and sessions relation to KidProfile
- `server/prisma/migrations/20260321200202_add_sessions/migration.sql` - DB migration creating sessions table
- `server/src/routes/sessions.js` - POST /heartbeat and POST /end endpoints, kid-auth only
- `server/src/routes/analytics.js` - GET /parent/:childId with dailyMinutes + moduleStars aggregation
- `server/src/index.js` - Wired sessions and analytics routes with requireAuth middleware
- `server/tests/observability/obs02-sessions.test.js` - 3 tests: create session, update session, 401 without auth
- `server/tests/observability/obs02-analytics.test.js` - 3 tests: returns data, 403 for non-owned child, 401 without auth

## Decisions Made

- Added `requireAuth` to both route registrations in index.js (not done in the plan's Step 4 snippet). The plan's snippet omitted middleware, which would have left endpoints unauthenticated — fixed as Rule 2 (missing auth on protected routes).
- Sessions route additionally checks `req.user.type === 'kid'` to reject parent tokens with 403, since heartbeat is a kid-only action.
- Analytics test uses `SUPABASE_URL = ''` to trigger the mock-user path in auth middleware, matching the established Phase 04 pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added requireAuth middleware to sessions/analytics route registrations**
- **Found during:** Task 1 (wiring routes in index.js)
- **Issue:** Plan's Step 4 snippet showed `app.use('/api/sessions', sessionsRoutes)` without `requireAuth`. Without it, endpoints would accept unauthenticated requests.
- **Fix:** Added `requireAuth` to both registrations: `app.use('/api/sessions', requireAuth, sessionsRoutes)` and `app.use('/api/parent/analytics', requireAuth, analyticsRoutes)`
- **Files modified:** server/src/index.js
- **Verification:** Test `POST /api/sessions/heartbeat without auth returns 401` passes; analytics test `without auth returns 401` passes
- **Committed in:** dc26129 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (missing auth middleware)
**Impact on plan:** Essential security fix. No scope creep.

## Issues Encountered

- After initial schema edit, Prisma client did not have `session` model because `prisma generate` had not been run. Ran `npx prisma generate` after migration to regenerate the client. All tests then passed.

## Next Phase Readiness

- Session tracking backend is live; client can now send POST /api/sessions/heartbeat every 60 seconds with optional `sessionId`
- Parent analytics endpoint is ready for frontend dashboard integration
- Ready for Phase 07 Plan 04 (client-side analytics dashboard)

---
*Phase: 07-analytics-observability*
*Completed: 2026-03-21*
