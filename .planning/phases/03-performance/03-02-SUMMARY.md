---
phase: 03-performance
plan: 02
subsystem: api
tags: [prisma, transaction, promise-all, promise-allsettled, resend, performance, batching]

requires:
  - phase: 01-security-hardening
    provides: "prisma.$transaction pattern (interactive callback) used for coin purchase in kids.js"
  - phase: 03-performance
    provides: "03-01 established perf test structure and global.prisma spy pattern"

provides:
  - "Transaction-wrapped upsertProgress: lessonProgress upsert + kidProfile star/coin update in single prisma.$transaction"
  - "Merged star/coin update: two separate kidProfile.update calls consolidated into one conditional update"
  - "Parallelized stats endpoint: lessonProgress.findMany + module.findMany fired concurrently via Promise.all"
  - "Batched weekly digest: serial parent loop replaced with Promise.allSettled chunks of 10"
  - "getKidWeeklyStats exported from weeklyDigest.js for testing"

affects: [04-monetization, future-performance-phases]

tech-stack:
  added: []
  patterns:
    - "prisma.$transaction(async (tx) => ...) interactive callback for atomic multi-table writes"
    - "Promise.all for independent concurrent DB queries (no shared data)"
    - "Promise.allSettled for batch processing where individual failures should not abort the batch"

key-files:
  created:
    - server/tests/performance/perf02-transaction.test.js
    - server/tests/performance/perf03-stats-query.test.js
    - server/tests/performance/perf04-digest-batch.test.js
  modified:
    - server/src/services/progressSync.js
    - server/src/routes/progress.js
    - server/src/services/weeklyDigest.js
    - server/tests/security/sec06-body-destructure.test.js

key-decisions:
  - "Streak update remains outside prisma.$transaction as non-critical best-effort — streak failure must not roll back the lesson save"
  - "Two kidProfile.update calls (stars + coins) merged into one conditional update using dataUpdate object inside transaction"
  - "Promise.allSettled for digest batch — individual send failures logged but do not block the batch"
  - "BATCH_SIZE=10 for weekly digest sends"
  - "sec06 test updated to spy on prisma.$transaction (not lessonProgress.upsert directly) because upsertProgress now runs all DB writes inside a transaction"

patterns-established:
  - "Transaction spy pattern: vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(txMock)) — required for testing code that uses prisma.$transaction"
  - "Capture upsert args through txMock.lessonProgress.upsert mockImplementation for field-level assertions"

requirements-completed: [PERF-02, PERF-03, PERF-04]

duration: 4min
completed: 2026-03-20
---

# Phase 03 Plan 02: Backend Query Optimization Summary

**Prisma $transaction wrapping lesson saves, Promise.all parallelizing stats queries, and Promise.allSettled batching weekly digest sends — reducing DB round-trips and converting O(N) serial email sends to O(N/10) batched execution**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T19:32:53Z
- **Completed:** 2026-03-20T19:36:30Z
- **Tasks:** 2
- **Files modified:** 7 (3 source, 4 test)

## Accomplishments
- Wrapped `upsertProgress` steps 1-4 (lessonProgress.findUnique, lessonProgress.upsert, kidProfile stars/coins update) in a single `prisma.$transaction` — 4 operations are now atomic; streak remains outside as a best-effort non-critical operation
- Merged two separate `kidProfile.update` calls (stars + coins) into one conditional update using a `dataUpdate` object inside the transaction, eliminating a redundant DB round-trip
- Parallelized the stats endpoint by replacing two sequential `await prisma.*` calls with a single `Promise.all([...])` — both queries now fire concurrently
- Converted the weekly digest from a serial `for` loop (O(N) awaits) to a `Promise.allSettled` batch loop with `BATCH_SIZE=10`, reducing wall-clock time from O(N) to O(N/10)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wrap upsertProgress in Prisma $transaction (PERF-02)** - `368d030` (feat)
2. **Task 2: Parallelize stats queries (PERF-03) and batch digest sends (PERF-04)** - `9a65830` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `server/src/services/progressSync.js` - Transaction-wrapped upsertProgress with merged star/coin update; streak outside transaction
- `server/src/routes/progress.js` - Stats handler refactored to use Promise.all for concurrent lessonProgress + module queries
- `server/src/services/weeklyDigest.js` - sendWeeklyDigests batched with Promise.allSettled (BATCH_SIZE=10); getKidWeeklyStats exported
- `server/tests/performance/perf02-transaction.test.js` - Tests prisma.$transaction called once per lesson save
- `server/tests/performance/perf03-stats-query.test.js` - Tests module.findMany called once (not twice) in stats handler
- `server/tests/performance/perf04-digest-batch.test.js` - Tests sendWeeklyDigests completes with 15 parents in 2 batches
- `server/tests/security/sec06-body-destructure.test.js` - Updated to spy on prisma.$transaction instead of lessonProgress.upsert directly

## Decisions Made
- Streak update stays outside the transaction: a streak failure (network blip, race condition) should never roll back a lesson save — correctness of the lesson record is higher priority
- Two separate kidProfile.update calls (stars, coins) merged into one: inside a transaction this halves the writes while maintaining atomicity
- `Promise.allSettled` chosen over `Promise.all` for digest batch: individual email failures are logged but don't abort the remaining sends in the batch

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] sec06 body-destructure test broken by transaction refactor**
- **Found during:** Task 2 (full test suite run after parallelization changes)
- **Issue:** `sec06-body-destructure.test.js` spied on `prisma.lessonProgress.upsert` directly. After PERF-02, `upsertProgress` runs all DB writes inside `prisma.$transaction`, so the spy on `prisma.lessonProgress.upsert` is never called — the `tx` proxy passed to the callback is a separate object. Both tests returned 500 instead of 200.
- **Fix:** Rewrote sec06 to spy on `prisma.$transaction` (same pattern as perf02 test), capture upsert args through `txMock.lessonProgress.upsert`, and assert field-level correctness through `capturedTxUpsertArgs`. All assertions preserved.
- **Files modified:** `server/tests/security/sec06-body-destructure.test.js`
- **Verification:** `npx vitest run` — all 27 tests pass (10 test files)
- **Committed in:** `9a65830` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug caused by this plan's own changes)
**Impact on plan:** Necessary fix. The sec06 test was validating the same behavior (no extra body fields passed to upsert) — just needed to observe it through the transaction spy instead of directly.

## Issues Encountered
None — the sec06 test regression was predictable from introducing the transaction and was fixed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three backend hotspots (PERF-02, PERF-03, PERF-04) optimized and test-covered
- Full test suite green (27 tests, 10 files)
- Phase 03-performance plan 02 complete — ready for phase 04 monetization or any remaining performance plans

---
*Phase: 03-performance*
*Completed: 2026-03-20*

## Self-Check: PASSED

All files verified present:
- FOUND: server/src/services/progressSync.js
- FOUND: server/src/routes/progress.js
- FOUND: server/src/services/weeklyDigest.js
- FOUND: server/tests/performance/perf02-transaction.test.js
- FOUND: server/tests/performance/perf03-stats-query.test.js
- FOUND: server/tests/performance/perf04-digest-batch.test.js
- FOUND: .planning/phases/03-performance/03-02-SUMMARY.md

All commits verified: 368d030 (Task 1), 9a65830 (Task 2)
