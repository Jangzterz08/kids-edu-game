---
phase: 08-infrastructure
plan: 01
subsystem: database
tags: [prisma, postgres, scoring, vitest, tdd]

requires: []
provides:
  - sortScore, trueFalseScore, memoryMatchScore columns in LessonProgress (Prisma schema + migration)
  - SCORE_FIELDS extended to 11 entries in progressSync.js
  - computeStars exported from progressSync.js
  - POST /api/progress/:kidId/lesson/:slug wired to receive and persist all 3 new score fields
affects: [09-games]

tech-stack:
  added: []
  patterns:
    - "SCORE_FIELDS as single registry: adding a field to the array automatically cascades to scoreData loop, computeStars, SM-2, and ModuleDifficulty accuracy"
    - "Hard-coded select block in progressSync.js must be kept in sync with SCORE_FIELDS manually"
    - "Migration naming: YYYYMMDDHHMMSS_description — IF NOT EXISTS guards for idempotent re-runs"

key-files:
  created:
    - server/tests/adaptive/infra01-score-fields.test.js
    - server/prisma/migrations/20260322000000_add_new_game_scores/migration.sql
  modified:
    - server/prisma/schema.prisma
    - server/src/services/progressSync.js
    - server/src/routes/progress.js

key-decisions:
  - "computeStars added to module.exports alongside SCORE_FIELDS so unit tests can import it without full integration setup"

patterns-established:
  - "TDD RED/GREEN: test file committed before implementation; failing import is acceptable at RED stage"
  - "Test env setup: set process.env.DATABASE_URL before require() at module scope to prevent db.js URL parse error"

requirements-completed: [INFRA-01, INFRA-02]

duration: 3min
completed: 2026-03-22
---

# Phase 08 Plan 01: DB Score Columns + Pipeline Wiring Summary

**Three new score columns (sortScore, trueFalseScore, memoryMatchScore) added to Prisma schema, migration SQL written, SCORE_FIELDS extended to 11 entries, and POST route wired end-to-end so Phase 9 game components can persist scores without silent nulls**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T06:00:35Z
- **Completed:** 2026-03-22T06:04:06Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 5

## Accomplishments

- Prisma schema and migration SQL add sortScore, trueFalseScore, memoryMatchScore as nullable Int columns
- SCORE_FIELDS registry in progressSync.js extended from 8 to 11 entries; computeStars exported
- POST /api/progress/:kidId/lesson/:slug destructures and passes all 3 new fields to upsertProgress
- 6 vitest unit tests confirm SCORE_FIELDS length, membership, and computeStars star-rating logic

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests (RED)** - `118dc5a` (test)
2. **Task 2: Prisma migration + SCORE_FIELDS + POST route wiring (GREEN)** - `f28674f` (feat)

## Files Created/Modified

- `server/tests/adaptive/infra01-score-fields.test.js` - 6 unit tests covering SCORE_FIELDS registry and computeStars behavior for all 3 new game types
- `server/prisma/migrations/20260322000000_add_new_game_scores/migration.sql` - 3 ALTER TABLE ADD COLUMN IF NOT EXISTS statements
- `server/prisma/schema.prisma` - LessonProgress model extended with sortScore, trueFalseScore, memoryMatchScore as Int?
- `server/src/services/progressSync.js` - SCORE_FIELDS extended to 11, select block updated, computeStars added to module.exports
- `server/src/routes/progress.js` - POST destructure and upsertProgress call include all 3 new score fields

## Decisions Made

- Added `computeStars` to `module.exports` in progressSync.js. It was previously unexported. The tests need direct access to verify star-rating logic without a full DB integration stack. This is a minimal, non-breaking change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added DATABASE_URL env setup in test file before require()**
- **Found during:** Task 2 (GREEN verification)
- **Issue:** `createRequire` executes `progressSync.js` which requires `db.js` which calls `createClient(DATABASE_URL)` — URL was undefined, throwing `TypeError: Invalid URL` before any test ran
- **Fix:** Added `process.env.DATABASE_URL = ...` at module scope in the test file, matching the pattern from `adl01-difficulty-write.test.js`
- **Files modified:** server/tests/adaptive/infra01-score-fields.test.js
- **Verification:** All 6 tests pass
- **Committed in:** f28674f (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking)
**Impact on plan:** Env setup is required for any test importing from progressSync.js. No scope creep.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

The migration SQL must be applied to the Supabase database before deploying Phase 9 games. The columns will be added via:

```sql
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "sortScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "trueFalseScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "memoryMatchScore" INTEGER;
```

Run via Railway deploy (`prisma migrate deploy`) or manually via Supabase SQL editor.

## Next Phase Readiness

- DB columns and server pipeline ready for Phase 9 game components to call `recordLesson()` with sortScore, trueFalseScore, or memoryMatchScore
- Phase 9 build order: TrueFalseGame first (simplest end-to-end validation), MemoryMatchGame second, SortGame third (touch events)

---
*Phase: 08-infrastructure*
*Completed: 2026-03-22*
