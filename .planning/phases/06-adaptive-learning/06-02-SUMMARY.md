---
phase: 06-adaptive-learning
plan: 02
subsystem: adaptive-learning
tags: [recommendations, review-today, home-summary, kid-home, personalization]
dependency_graph:
  requires: [06-01]
  provides: [recommendations-api, review-today-api, kid-home-adl-ui]
  affects: [kids.js, KidHome.jsx]
tech_stack:
  added: []
  patterns: [Promise.all parallel queries, inline style ADL sections, TDD red-green cycle]
key_files:
  created:
    - server/tests/adaptive/adl02-recommendations.test.js
    - server/tests/adaptive/adl03-review-today.test.js
  modified:
    - server/src/routes/kids.js
    - server/tests/performance/perf01-home-summary.test.js
    - server/tests/monetization/mon01-module-gating.test.js
    - server/tests/school/sch04-module-unlock.test.js
    - client/src/pages/KidHome.jsx
decisions:
  - "reviewToday lastReviewedAt stripped from response after sort — internal sort key not needed by client"
  - "adlCard styles match ocean theme (rgba glass-morphism) rather than plan's solid card-bg to fit existing UI aesthetic"
  - "mon01 and sch04 test mocks updated to add moduleDifficulty/reviewSchedule stubs — required by Rule 1 (bug: new DB queries in Promise.all caused 500 on tests missing mocks)"
metrics:
  duration_seconds: 277
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 7
---

# Phase 06 Plan 02: Recommendations and Review Today Summary

**One-liner:** Home-summary API extended with medium-band module recommendations and due-lesson review queue; KidHome renders both as horizontally scrollable card sections above the module grid.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Write failing tests for recommendations + reviewToday | 2d868a3 | adl02-recommendations.test.js, adl03-review-today.test.js |
| 1 (GREEN) | Extend home-summary with recommendations and reviewToday | 559bb48 | kids.js, perf01, mon01, sch04 tests |
| 2 | Add Recommended for You and Review Today sections to KidHome | d7c0366 | KidHome.jsx |

## What Was Built

**API changes (kids.js):**
- Added `SCORE_FIELDS` import from `progressSync.js`
- Added `prisma.moduleDifficulty.findMany` and `prisma.reviewSchedule.findMany` to the `Promise.all` block (parallel, no latency increase)
- `recommendations[]`: up to 3 objects `{ moduleSlug, title, iconEmoji }` — medium-band modules first, filled with untried modules sorted by `sortOrder`, capped at 3
- `reviewToday[]`: up to 3 objects `{ lessonId, lessonSlug, lessonTitle, moduleSlug, moduleTitle, moduleIconEmoji, accuracy, dueDate }` — filtered to `dueDate <= now`, sorted by accuracy ascending then `lastReviewedAt` ascending, capped at 3

**KidHome UI:**
- Two new state variables: `recommendations`, `reviewToday`
- Both populated from `data.recommendations` and `data.reviewToday` in the `api.get` handler
- "Recommended for You" section renders above module grid, hidden when `recommendations.length === 0`
- "Review Today" section renders below recommendations, hidden when `reviewToday.length === 0`
- Cards use ocean theme glass-morphism style, navigate to `/play/:moduleSlug` on click

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] mon01 and sch04 test mocks missing for new DB calls**
- **Found during:** Task 1 GREEN verification (full suite run)
- **Issue:** `mon01-module-gating.test.js` and `sch04-module-unlock.test.js` had `beforeEach` blocks mocking home-summary-related models but did not mock `moduleDifficulty.findMany` or `reviewSchedule.findMany` — the new Promise.all calls caused 500 errors in those tests
- **Fix:** Added `vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([])` and `vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([])` to the affected `beforeEach` blocks in both files
- **Files modified:** server/tests/monetization/mon01-module-gating.test.js, server/tests/school/sch04-module-unlock.test.js
- **Commit:** 559bb48

**2. [Style deviation] adlCard uses ocean glass-morphism instead of plan's solid card-bg**
- **Found during:** Task 2
- **Issue:** Plan specified `background: 'var(--card-bg, #ebf8ff)'` but KidHome's main panel has a translucent ocean gradient background — a solid card would look inconsistent with the existing module cards
- **Fix:** Used `rgba(255,255,255,0.28)` with `backdrop-filter: blur(12px)` to match the sidebar/panel aesthetic, white text with text-shadow to match module card text style
- **Impact:** Visual only — no behavior change

## Verification Results

- `server/tests/adaptive/adl02-recommendations.test.js`: 5 tests — all pass
- `server/tests/adaptive/adl03-review-today.test.js`: 6 tests — all pass
- `server/tests/performance/perf01-home-summary.test.js`: 2 tests — all pass (no regression)
- Full backend test suite: **125 tests across 25 files — all pass**
- Vite client build: clean, no errors

## Self-Check

Verifying created files and commits exist.

## Self-Check: PASSED

- adl02-recommendations.test.js: FOUND
- adl03-review-today.test.js: FOUND
- 06-02-SUMMARY.md: FOUND
- Commit 2d868a3 (TDD RED tests): FOUND
- Commit 559bb48 (feat home-summary): FOUND
- Commit d7c0366 (feat KidHome UI): FOUND
