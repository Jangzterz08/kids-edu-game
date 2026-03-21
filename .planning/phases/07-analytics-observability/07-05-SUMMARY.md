---
phase: 07-analytics-observability
plan: 05
subsystem: ui
tags: [react, recharts, analytics, session-tracking, heartbeat]

# Dependency graph
requires:
  - phase: 07-03
    provides: POST /api/sessions/heartbeat, POST /api/sessions/end, GET /api/parent/analytics/:childId

provides:
  - useSessionHeartbeat hook — 60s heartbeat with sendBeacon on unload
  - DailyMinutesChart — recharts BarChart showing daily minutes for 7-day period
  - ModuleStarsChart — recharts BarChart (layout=vertical) with color-coded avgStars per module
  - ParentAnalytics page — fetches /api/parent/analytics/:childId and renders both charts
  - /parent/analytics route registered in App.jsx
  - View Analytics button on ParentDashboard

affects:
  - future-phases-using-analytics-data

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Silent heartbeat hook — all errors swallowed so analytics never breaks the game
    - sendBeacon for unload — guarantees session end fires even when page closes mid-session
    - Color-coded recharts Cell — green/yellow/red threshold coloring for module stars

key-files:
  created:
    - client/src/hooks/useSessionHeartbeat.js
    - client/src/pages/ParentAnalytics.jsx
    - client/src/components/analytics/DailyMinutesChart.jsx
    - client/src/components/analytics/ModuleStarsChart.jsx
  modified:
    - client/src/pages/MiniGame.jsx
    - client/src/pages/ParentDashboard.jsx
    - client/src/App.jsx

key-decisions:
  - "useSessionHeartbeat placed at top of MiniGame component body — session starts when kid enters any game, ends on exit"
  - "All heartbeat errors silently swallowed — analytics non-critical, must never crash the game"
  - "navigator.sendBeacon used for unload end-session — survives browser tab close unlike fetch"

patterns-established:
  - "Silent analytics hooks: analytics errors must never propagate to UI"
  - "recharts BarChart with Cell for conditional coloring: avgStars >= 2.5 green, >= 1 yellow, < 1 red"

requirements-completed:
  - OBS-02

# Metrics
duration: 12min
completed: 2026-03-21
---

# Phase 07 Plan 05: Analytics Frontend Summary

**React session heartbeat hook with 60s interval + sendBeacon, and parent analytics page with recharts DailyMinutesChart and ModuleStarsChart visualizing kid learning activity**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-21T20:10:00Z
- **Completed:** 2026-03-21T20:22:00Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments
- Created `useSessionHeartbeat` hook: starts session on mount, sends heartbeat every 60s, ends session on unmount or page unload via `navigator.sendBeacon`
- Wired heartbeat into `MiniGame.jsx` so session tracking activates whenever a kid plays a game
- Created `DailyMinutesChart` — recharts BarChart displaying 7-day minute totals with "No activity" empty state
- Created `ModuleStarsChart` — recharts vertical BarChart with Cell color-coding (green/yellow/red) for per-module avgStars
- Created `ParentAnalytics` page fetching `/api/parent/analytics/:childId?period=7d` with kid selector tabs and two chart sections
- Added "View Analytics" button to `ParentDashboard` navigating to `/parent/analytics`
- Registered `/parent/analytics` lazy route in `App.jsx` under parent ProtectedRoute

## Task Commits

Each task was committed atomically:

1. **Task 1: Client heartbeat hook + ParentAnalytics page with recharts + routing** - `d550b98` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `client/src/hooks/useSessionHeartbeat.js` — 60s heartbeat hook with sendBeacon for session tracking
- `client/src/pages/ParentAnalytics.jsx` — analytics page with kid selector and two chart sections
- `client/src/components/analytics/DailyMinutesChart.jsx` — recharts BarChart for daily minutes
- `client/src/components/analytics/ModuleStarsChart.jsx` — recharts vertical BarChart with color-coded cells
- `client/src/pages/MiniGame.jsx` — added useSessionHeartbeat() call at top of component
- `client/src/pages/ParentDashboard.jsx` — added useNavigate + "View Analytics" button
- `client/src/App.jsx` — added ParentAnalytics lazy import and /parent/analytics route

## Decisions Made
- `useSessionHeartbeat` placed as first hook call in MiniGame so session starts when kid enters any game and ends on exit
- All heartbeat/analytics errors silently swallowed — analytics must never interrupt the learning experience
- `navigator.sendBeacon` used for unload end-session — ensures the session end fires even when the user closes the browser tab

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- The analytics component directory `client/src/components/analytics/` did not exist — created it as part of execution (Rule 3 prerequisite, not a deviation).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All session tracking and parent analytics UI is complete for Phase 07
- Parent can navigate to /parent/analytics, select a child, and view daily minutes bar chart + module stars chart
- Phase 07 analytics-observability is now fully implemented across all 5 plans

---
*Phase: 07-analytics-observability*
*Completed: 2026-03-21*
