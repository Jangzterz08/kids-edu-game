---
phase: 02-polish-ux
plan: 01
subsystem: ui
tags: [react, sonner, react-error-boundary, toast, error-boundary, vite]

# Dependency graph
requires:
  - phase: 01-security-hardening
    provides: secure progress API endpoints that the toast hook now reads
provides:
  - ErrorFallback ocean gradient crash screen with Ollie mascot
  - Toaster mounted at root level with richColors for coin/streak/error toasts
  - Toast notifications wired into useProgress.js recordLesson
  - streakCount added to POST /api/progress/:kidId/lesson/:lessonSlug response
affects:
  - 02-02 (InstallPrompt + OfflineBanner)
  - 02-03 (avatar constant extraction)
  - All future plans using useProgress.js

# Tech tracking
tech-stack:
  added:
    - sonner@2.0.7 (toast notification library)
    - react-error-boundary@6.1.1 (React error boundary HOC)
  patterns:
    - Toaster mounted as sibling to App inside ErrorBoundary so toasts work during normal operation and ErrorBoundary catches render crashes
    - recordLesson captures API response and fires toast based on coinsDelta and streakCount fields
    - Server returns streakCount alongside coinsDelta in lesson progress response

key-files:
  created:
    - client/src/components/ui/ErrorFallback.jsx
  modified:
    - client/src/main.jsx
    - client/src/hooks/useProgress.js
    - server/src/routes/progress.js
    - client/package.json

key-decisions:
  - "sonner@2.0.7 + react-error-boundary@6.1.1 installed in client/; toast copy from CONTEXT.md locked decisions"
  - "streakCount added to POST /lesson response by reading updated kid profile after upsertProgress call"
  - "Duplicate streak update in route handler removed; upsertProgress (progressSync service) is the single owner of streak logic"
  - "toast calls placed in useProgress.js (not MiniGame.jsx) so toast fires from the single point where API response is received"

patterns-established:
  - "Pattern 1: Toast calls live in the hook that owns the API call, not in the UI component"
  - "Pattern 2: ErrorBoundary wraps entire app in main.jsx with ocean-themed fallback, not per-route"

requirements-completed: [POL-01, POL-02]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 02 Plan 01: Sonner Toasts + ErrorBoundary Crash Screen Summary

**sonner toast notifications and react-error-boundary crash recovery wired into KidsLearn: coin/streak/error toasts in useProgress.js, Ollie octopus full-screen fallback in main.jsx**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T18:40:54Z
- **Completed:** 2026-03-20T18:43:18Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Installed sonner@2.0.7 and react-error-boundary@6.1.1 in client/
- Created ErrorFallback.jsx: full-screen ocean gradient, Ollie (🐙) at 64px, Fredoka headings, "Try again" button navigates to "/"
- Rewrote main.jsx: ErrorBoundary wraps App with FallbackComponent=ErrorFallback; Toaster at top-center with richColors as sibling to App
- Wired toast calls in useProgress.js: toast.success for coin rewards (+🪙 N coins!), toast for streaks (🔥 N day streak!), toast.error for offline sync failure and generic errors
- Added streakCount to POST /api/progress/:kidId/lesson/:lessonSlug response by reading updated kid profile after upsertProgress

## Task Commits

Each task was committed atomically:

1. **Task 1: Install libraries, create ErrorFallback, rewrite main.jsx** - `a23aab5` (feat)
2. **Task 2: Wire toast calls at coin, streak, and error event sites** - `2241ca2` (feat)

**Plan metadata:** (docs commit — see final_commit step)

## Files Created/Modified

- `client/src/components/ui/ErrorFallback.jsx` - Ocean gradient crash screen with Ollie mascot and "Try again" button
- `client/src/main.jsx` - Root mount rewritten with ErrorBoundary + Toaster
- `client/src/hooks/useProgress.js` - recordLesson now captures response, fires toasts for coins/streaks/errors
- `server/src/routes/progress.js` - POST /lesson response now includes streakCount; removed duplicate streak update
- `client/package.json` - Added sonner@2.0.7 and react-error-boundary@6.1.1

## Decisions Made

- Toast calls placed in useProgress.js (not MiniGame.jsx) — the hook owns the API call, so it's the natural place for response-driven toasts
- Duplicate streak update in progress route removed — `upsertProgress` in progressSync.js already handles streak; route was updating it twice (harmless but redundant)
- streakCount added to progress response by querying the updated kid profile after upsertProgress returns, so client always gets the post-update value
- Exact toast copy from CONTEXT.md locked decisions used verbatim (emoji encoded as unicode escapes for compatibility)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed duplicate streak update and added streakCount to server response**
- **Found during:** Task 2 (Wire toast calls)
- **Issue:** POST /lesson route duplicated the streak update already done inside `upsertProgress`. Response only returned `record` (LessonProgress + coinsDelta) with no `streakCount` — the client had no way to display streak toasts
- **Fix:** Removed duplicate streak update block in route handler; added `updatedKid` query after upsertProgress to get current streak; spread `streakCount` into response alongside `record`
- **Files modified:** server/src/routes/progress.js
- **Verification:** 21 server tests pass; build passes; response now includes `streakCount`
- **Committed in:** `2241ca2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Required for correctness — without streakCount in the response the streak toast would never fire. Duplicate streak update removal is a correctness improvement (no race with two updates).

## Issues Encountered

None — build succeeded on first attempt, all 21 server tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02-01 complete: Toaster and ErrorBoundary are live at root level
- Plan 02-02 can now mount InstallPrompt and OfflineBanner into App.jsx
- Plan 02-03 (avatar constant) and further plans have no blocking dependency on 02-01

---
*Phase: 02-polish-ux*
*Completed: 2026-03-20*
