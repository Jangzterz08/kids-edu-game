---
phase: 07-analytics-observability
plan: "01"
subsystem: ui
tags: [react, css, viewport, dvh, flexbox, mobile]
dependency_graph:
  requires: []
  provides: [viewport-constrained-games]
  affects: [client/src/components/layout/KidLayout.jsx, client/src/components/games]
tech_stack:
  added: []
  patterns:
    - "100dvh root constraint with overflow:hidden to prevent page-level scroll in game views"
    - "flex:0 0 auto for prompt/question areas, flex:1 1 0 + overflowY:auto for answer areas"
    - "maxHeight:25vh for question images instead of fixed pixel heights"
key_files:
  created: []
  modified:
    - client/src/components/layout/KidLayout.jsx
    - client/src/components/games/MatchingGame.jsx
    - client/src/components/games/OddOneOutGame.jsx
    - client/src/components/games/PatternGame.jsx
    - client/src/components/games/PhonicsGame.jsx
    - client/src/components/games/QuizGame.jsx
    - client/src/components/games/SpellingGame.jsx
    - client/src/components/games/TracingGame.jsx
    - client/src/components/games/WordScramble.jsx
key-decisions:
  - "100dvh (not 100vh) on KidLayout container with overflow:hidden — prevents page-level scroll; main area gets calc(100dvh - 56px)"
  - "Header reduced from 72px to 56px — gives 16px more vertical space to games on small screens"
  - "flex:1 1 0 + overflowY:auto + minHeight:0 on answer areas — enables internal scroll without affecting outer viewport"
  - "maxHeight:25vh on images — replaces fixed pixel heights that caused overflow on small viewports"
  - "Game components use height:100% (not 100dvh) — inherit constrained height from KidLayout main area"
requirements-completed: [OBS-01]
metrics:
  duration_seconds: 420
  completed_date: "2026-03-21"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 9
---

# Phase 7 Plan 1: Game Viewport Fix Summary

**All 8 game types constrained to 100dvh using flex column layout — 56px header, game content fills remaining height, answer areas scroll internally without page-level scroll on any target breakpoint**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-21T19:00:00Z
- **Completed:** 2026-03-21T19:07:00Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 9

## Accomplishments

- KidLayout root changed from `minHeight:100vh` to `height:100dvh` with `overflow:hidden` — prevents mobile browser bounce/scroll
- Header height reduced from 72px to 56px, freeing more vertical space for game content on small screens
- All 8 game components updated to flex column layout filling `height:100%`: MatchingGame, OddOneOutGame, PatternGame, PhonicsGame, QuizGame, SpellingGame, TracingGame, WordScramble
- Answer/choice areas in every game use `flex:1 1 0` with `minHeight:0` and `overflowY:auto` for internal scrolling
- Question images capped at `maxHeight:25vh` instead of fixed 200px heights
- Human visual verification approved at 375x667 (iPhone SE), 390x844 (iPhone 14), and 1280x800 (laptop)

## Task Commits

1. **Task 1: Update KidLayout container to 100dvh with 56px header** - `b8e0156` (feat)
2. **Task 2: Update all 8 game components to flex-fill within viewport** - `65cbeed` (feat)
3. **Task 3: Verify game viewport fit across breakpoints** - human-verify checkpoint approved by user

## Files Created/Modified

- `client/src/components/layout/KidLayout.jsx` - container changed to height:100dvh overflow:hidden, header 56px, main with calc(100dvh-56px)
- `client/src/components/games/QuizGame.jsx` - flex column root, prompt area flex:0 0 auto, 4 answer buttons in flex:1 1 0 area
- `client/src/components/games/MatchingGame.jsx` - card grid uses flex:1 1 0 with overflowY:auto
- `client/src/components/games/OddOneOutGame.jsx` - item grid uses flex:1 1 0 with overflowY:auto
- `client/src/components/games/PatternGame.jsx` - pattern display flex:0 0 auto, choices flex:1 1 0
- `client/src/components/games/PhonicsGame.jsx` - audio prompt flex:0 0 auto, answer choices flex:1 1 0
- `client/src/components/games/SpellingGame.jsx` - letter tiles area flex:1 1 0 with internal scroll
- `client/src/components/games/TracingGame.jsx` - canvas area flex:1 1 0 with no internal scroll (canvas fills space)
- `client/src/components/games/WordScramble.jsx` - tiles area flex:1 1 0 with internal scroll

## Decisions Made

- Used `100dvh` not `100vh` — dynamic viewport height accounts for mobile browser chrome (address bar shrink/grow)
- Main wrapper retains `overflowY:auto` so non-game pages (KidHome, CoinStore, etc.) still scroll normally
- Game components use `height:100%` not `100dvh` — they inherit the constrained height from KidLayout's main area
- Header reduced to 56px: original 72px wasted space on small screens; nav icons (22px/20px) fit within 56px with reduced padding

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Viewport fix complete — game layout stable and verified across target breakpoints (375x667, 390x844, 1280x800)
- No regressions in game logic (callbacks, scoring, onComplete handlers unchanged)
- Ready to continue with remaining Phase 07 analytics/observability plans

## Self-Check

- [x] KidLayout.jsx modified with `height: '100dvh'` — commit b8e0156 confirmed
- [x] All 8 game files modified with `height: '100%'` on root container — commit 65cbeed confirmed
- [x] Task 3 human-verify checkpoint approved by user
- [x] All 3 tasks complete

---
*Phase: 07-analytics-observability*
*Completed: 2026-03-21*
