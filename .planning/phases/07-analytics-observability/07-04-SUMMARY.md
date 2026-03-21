---
phase: 07-analytics-observability
plan: 04
subsystem: api, ui
tags: [react, express, prisma, analytics, teacher]

# Dependency graph
requires:
  - phase: 07-analytics-observability plan 03
    provides: Parent analytics endpoint and analytics.js router base
  - phase: 07-analytics-observability plan 02
    provides: Sessions infrastructure and requireAuth middleware pattern
provides:
  - Teacher classroom analytics API endpoint at GET /api/teacher/classroom/:id/analytics
  - ClassroomAnalytics.jsx color-coded student-module matrix page
  - Analytics tab in ClassroomDetail.jsx
  - OBS-03 test suite (4 tests)
affects: [future teacher-facing features, school reporting, admin dashboards]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Single analyticsRoutes router mounted at two paths (/api/parent/analytics + /api/teacher) — avoids route file duplication
    - Teacher analytics endpoint resolves supabaseAuthId to dbUser then checks classroom.teacherId for ownership
    - Matrix computed server-side by bucketing lessonProgress on (kidId, moduleSlug) key

key-files:
  created:
    - server/tests/observability/obs03-analytics.test.js
    - client/src/pages/ClassroomAnalytics.jsx
  modified:
    - server/src/routes/analytics.js
    - server/src/index.js
    - client/src/pages/ClassroomDetail.jsx
    - client/src/App.jsx

key-decisions:
  - "analyticsRoutes router mounted at /api/teacher in addition to /api/parent/analytics — route path in analytics.js uses /classroom/:id/analytics (without teacher prefix) since mount point supplies it"
  - "ClassroomAnalytics rendered inline as third tab in ClassroomDetail (not a separate navigated page) — reads classroomId from URL params via useParams, no prop threading needed"
  - "Struggling = avgStars < 1.5 AND attempts >= 2 — both conditions required to flag, matching spec exactly"

patterns-established:
  - "Color-coded matrix cells: #D1FAE5 green >= 2.5, #FEF3C7 yellow 1.0-2.4, #FEE2E2 red < 1.0 — reusable pattern for future analytics views"
  - "Warning indicator U+26A0 applied in cell when avgStars < 1.5 AND attempts >= 2 — struggling definition encoded in getCellStyle/isStruggling helpers"

requirements-completed: [OBS-03]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 07 Plan 04: Teacher Classroom Analytics Summary

**Teacher analytics API endpoint + color-coded student-module matrix UI surfacing struggling students (avgStars < 1.5, attempts >= 2) with warning indicator**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-21T20:07:24Z
- **Completed:** 2026-03-21T20:10:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Teacher analytics endpoint at GET /api/teacher/classroom/:id/analytics returning students, modules, and per-student-per-module matrix
- Classroom ownership authorization via teacherId check before data access
- ClassroomAnalytics.jsx with color-coded table (green/yellow/red) and warning triangle for struggling students
- Analytics tab added to ClassroomDetail.jsx inline rendering
- Route added to App.jsx at /teacher/classroom/:id/analytics with lazy import
- 4-test OBS-03 suite covering 200 success, 403 non-owned, 401 unauthenticated, and matrix shape

## Task Commits

1. **Task 1: Teacher analytics endpoint + test scaffold** - `b68d8a3` (feat)
2. **Task 2: ClassroomAnalytics page + routing + tab link** - `2392c62` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `server/src/routes/analytics.js` - Added GET /classroom/:id/analytics route for teacher with matrix computation
- `server/src/index.js` - Added app.use('/api/teacher', requireAuth, analyticsRoutes) mount
- `server/tests/observability/obs03-analytics.test.js` - 4-test suite for teacher analytics endpoint
- `client/src/pages/ClassroomAnalytics.jsx` - Color-coded student-module matrix page with struggling indicator
- `client/src/pages/ClassroomDetail.jsx` - Added Analytics tab importing ClassroomAnalytics inline
- `client/src/App.jsx` - Added ClassroomAnalytics lazy import and /teacher/classroom/:id/analytics route

## Decisions Made
- Mounted analyticsRoutes at `/api/teacher` alongside `/api/parent/analytics` — both use the same router file; route path in analytics.js is `/classroom/:id/analytics` (without the teacher prefix) because the mount point provides it.
- ClassroomAnalytics reads classroom ID from `useParams()` so it works both as a tab embedded in ClassroomDetail and as a standalone navigated route.
- Struggling indicator requires both `avgStars < 1.5` AND `attempts >= 2` per spec — avoids false positives on a single bad attempt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed double-prefixed route path**
- **Found during:** Task 1 verification (test run returned 404)
- **Issue:** Plan spec showed route as `/teacher/classroom/:id/analytics` in analytics.js but the router is mounted at `/api/teacher`, making the actual path `/api/teacher/teacher/classroom/:id/analytics`
- **Fix:** Changed route path to `/classroom/:id/analytics` so the mount point + route path combine correctly to `/api/teacher/classroom/:id/analytics`
- **Files modified:** server/src/routes/analytics.js
- **Verification:** All 4 obs03 tests pass
- **Committed in:** b68d8a3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Essential fix for route resolution. No scope creep.

## Issues Encountered
None beyond the route prefix bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Teacher classroom analytics fully functional end-to-end
- Phase 07 plan 05 (final plan) can proceed
- No blockers

---
*Phase: 07-analytics-observability*
*Completed: 2026-03-21*
