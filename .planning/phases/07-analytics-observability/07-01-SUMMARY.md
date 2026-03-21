---
phase: 07-analytics-observability
plan: "01"
subsystem: client-layout
tags: [viewport, layout, mobile, games, css]
dependency_graph:
  requires: []
  provides: [viewport-constrained-games]
  affects: [client/src/components/layout/KidLayout.jsx, client/src/components/games]
tech_stack:
  added: []
  patterns: [100dvh-container, flex-fill-layout, internal-scroll-pattern]
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
decisions:
  - "100dvh on KidLayout container with overflow hidden — prevents page-level scroll; main area gets calc(100dvh - 56px) for non-game page scroll"
  - "header reduced from 72px to 56px — gives 16px more vertical space to games on small screens"
  - "flex 1 1 0 + overflowY auto + minHeight 0 on answer areas — enables internal scroll without affecting outer viewport"
  - "maxHeight 25vh on images — replaces fixed pixel heights that caused overflow on small viewports"
metrics:
  duration_seconds: 382
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 3
  files_changed: 9
---

# Phase 7 Plan 1: Game Viewport Fix Summary

**One-liner:** Constrained all 8 game types to 100dvh using flex layout with 56px header and internal-scroll answer areas.

## What Was Built

KidLayout and all 8 game components updated to eliminate page-level vertical scroll during gameplay. The fix uses a three-layer approach:
1. **KidLayout root**: `height: 100dvh; overflow: hidden` — hard viewport cap
2. **Header**: reduced 72px → 56px — frees 16px of game space
3. **Game components**: flex column layout where the prompt/question area is `flex: 0 0 auto` and the answer/choices area is `flex: 1 1 0; overflowY: auto; minHeight: 0` — answers scroll internally if they overflow, the page never scrolls

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | KidLayout: 100dvh container, 56px header, calc main | b8e0156 |
| 2 | 8 game components: flex-fill viewport layout | 65cbeed |

## Awaiting Checkpoint

Task 3 is a `checkpoint:human-verify` — visual verification required across breakpoints (375x667, 390x844, 1280x800) before this plan is marked complete.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] KidLayout.jsx modified with `height: '100dvh'`
- [x] All 8 game files modified with `height: '100%'` on root container
- [x] Both task commits exist: b8e0156, 65cbeed
