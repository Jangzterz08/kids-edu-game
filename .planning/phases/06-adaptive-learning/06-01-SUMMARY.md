---
phase: 06-adaptive-learning
plan: 01
subsystem: database
tags: [sm2, spaced-repetition, prisma, progressSync, adaptive-learning]

# Dependency graph
requires:
  - phase: 05-school-licensing
    provides: prisma.$transaction pattern with vi.spyOn for CJS tests
  - phase: 03-performance
    provides: progressSync.js with $transaction wrapping all DB writes

provides:
  - SM-2 pure algorithm in server/src/lib/sm2.js
  - Age-adjusted difficulty classification (easy/medium/hard) per ageGroup
  - ModuleDifficulty upsert inside every lesson save transaction
  - ReviewSchedule create (score below hard threshold) and update (SM-2) inside transaction
  - upsertProgress extended with ageGroup third parameter

affects:
  - 06-02 (recommendations and review queue endpoints read from these tables)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SM-2 spaced-repetition algorithm as pure CJS function with no external deps
    - ageGroup null-safe defaults throughout (falls back to 5-6 thresholds)
    - Transaction guard pattern (if entry.moduleSlug) for bulk sync backward compat

key-files:
  created:
    - server/src/lib/sm2.js
    - server/tests/adaptive/adl01-difficulty-write.test.js
  modified:
    - server/src/services/progressSync.js
    - server/src/routes/progress.js
    - server/tests/performance/perf02-transaction.test.js
    - server/tests/security/sec06-body-destructure.test.js

key-decisions:
  - "SM-2 implemented as pure CJS function (no deps) in server/src/lib/sm2.js — easiest to test and import"
  - "ageGroup null/undefined falls back to 5-6 thresholds (medLow=60, easy=75) — preserves backward compatibility with bulk sync callers that omit ageGroup"
  - "ModuleDifficulty accuracy uses best-score-per-lesson averaged across all module lessons, not just current lesson score"
  - "ReviewSchedule create guarded by score < hardThreshold AND no existing row — update always runs SM-2 when row exists regardless of score"
  - "lesson mock in perf02 and sec06 updated to include module: { slug: 'alphabet' } — required because progress route now reads lesson.module.slug"

patterns-established:
  - "SM-2 q scale: (scorePercent / 100) * 5, q >= 3 is passing, q < 3 is failing"
  - "txMock pattern in integration tests must include moduleDifficulty, reviewSchedule, and lessonProgress.findMany after this plan"

requirements-completed: [ADL-01]

# Metrics
duration: 12min
completed: 2026-03-21
---

# Phase 6 Plan 01: SM-2 Difficulty Write Summary

**SM-2 spaced-repetition algorithm + ModuleDifficulty/ReviewSchedule writes atomically inside the lesson save $transaction for age-adjusted adaptive learning**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-21T12:20:00Z
- **Completed:** 2026-03-21T12:32:27Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `server/src/lib/sm2.js` — pure SM-2 algorithm with `applySM2`, `classifyAccuracy`, `getHardThreshold`, `getThresholds`; age group lookup table for 3-4, 5-6, 7-8 with safe null defaults
- Extended `upsertProgress` in `progressSync.js` to upsert `ModuleDifficulty` (module-level accuracy + easy/medium/hard level) and create/update `ReviewSchedule` (SM-2 interval/easeFactor) inside the existing Prisma `$transaction`
- 25 new tests across SM-2 pure functions, classification, and transaction integration; full suite of 114 tests passes with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SM-2 utility and test scaffolds** - `0ede016` (test)
2. **Task 2: Wire difficulty + review writes into progressSync transaction** - `8a6ba91` (feat)

**Plan metadata:** (docs commit below)

_Note: Task 1 used TDD RED commit (tests failing), Task 2 is GREEN (all pass)_

## Files Created/Modified

- `server/src/lib/sm2.js` — SM-2 algorithm + age-adjusted threshold classification (new)
- `server/tests/adaptive/adl01-difficulty-write.test.js` — 25 unit + integration tests (new)
- `server/src/services/progressSync.js` — added sm2 import, ageGroup param, moduleDifficulty upsert, reviewSchedule create/update in transaction
- `server/src/routes/progress.js` — pass moduleSlug + kid.ageGroup to upsertProgress at both call sites
- `server/tests/performance/perf02-transaction.test.js` — txMock extended with moduleDifficulty, reviewSchedule, lessonProgress.findMany; lesson mock includes module
- `server/tests/security/sec06-body-destructure.test.js` — txMock extended with new models; lesson mock includes module

## Decisions Made

- SM-2 q scale maps 0-100% score to 0-5 quality rating (`q = (scorePercent/100)*5`); q>=3 is passing
- easeFactor formula: `max(1.3, EF + 0.1 - (5-q)*(0.08 + (5-q)*0.02))` — only applied on passing scores
- ModuleDifficulty accuracy = average of best-score-per-lesson across all lessons in the module (not just current lesson)
- `ageGroup` param defaults to null throughout — `getThresholds(null)` returns 5-6 defaults
- Free module slug `alphabet` used in perf02/sec06 lesson mocks to bypass premium gating

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated lesson mocks in perf02 and sec06 to include module field**
- **Found during:** Task 2 (regression check after wiring progressSync)
- **Issue:** progress.js now reads `lesson.module.slug`; existing test mocks returned `{ id, slug }` without `module`, causing 500 errors
- **Fix:** Added `module: { slug: 'alphabet' }` to lesson mocks in both test files; used free module slug to bypass premium gating
- **Files modified:** `server/tests/performance/perf02-transaction.test.js`, `server/tests/security/sec06-body-destructure.test.js`
- **Verification:** Both files pass; full suite 114/114 green
- **Committed in:** `8a6ba91` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed SM-2 test expectation for easeFactor at q=4 (score 80%)**
- **Found during:** Task 1 (RED phase test run)
- **Issue:** Test expected easeFactor to increase for score=80% but math yields q=4.0 → boost=0; easeFactor stays at 2.5. Plan spec comment `~2.6` applies to score=100% (q=5)
- **Fix:** Updated test assertion from `toBeGreaterThan(2.5)` to `toBeCloseTo(2.5)` with comment explaining the math
- **Files modified:** `server/tests/adaptive/adl01-difficulty-write.test.js`
- **Verification:** All SM-2 pure function tests pass
- **Committed in:** `0ede016` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- SM-2 easeFactor formula at q=4 (80% score) yields zero boost — plan spec comment "`~2.6`" was misleading (applies to 100% score / q=5). Clarified in test comments.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ModuleDifficulty` and `ReviewSchedule` tables are now populated on every lesson save
- Plan 02 can read from these tables to surface recommendations and review queues
- All 114 tests green; no blockers

---
*Phase: 06-adaptive-learning*
*Completed: 2026-03-21*
