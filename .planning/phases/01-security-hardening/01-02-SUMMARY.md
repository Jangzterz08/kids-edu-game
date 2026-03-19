---
phase: 01-security-hardening
plan: 02
subsystem: server
tags: [security, sanitization, xss, startup-guard, transaction, body-destructuring]
dependency_graph:
  requires: [01-01]
  provides: [SEC-03, SEC-04, SEC-05, SEC-06]
  affects: [server/src/services/weeklyDigest.js, server/src/middleware/auth.js, server/src/routes/kids.js, server/src/routes/progress.js]
tech_stack:
  added: [he@1.2.0]
  patterns: [html-entity-escaping, production-startup-guard, prisma-interactive-transaction, request-body-allowlist]
key_files:
  created: []
  modified:
    - server/src/services/weeklyDigest.js
    - server/src/middleware/auth.js
    - server/src/routes/kids.js
    - server/src/routes/progress.js
    - server/tests/security/sec03-sanitization.test.js
    - server/tests/security/sec04-startup-guard.test.js
    - server/tests/security/sec05-transaction.test.js
    - server/tests/security/sec06-body-destructure.test.js
    - server/tests/security/sec01-price-validation.test.js
decisions:
  - "Use he.escape() via esc() helper in weeklyDigest.js; export buildEmailHtml for unit testing"
  - "Startup guard uses module-load-time throw (not runtime check) for production env var validation"
  - "Prisma interactive transaction ($transaction async callback) wraps coin purchase to prevent lost-update races"
  - "SEC-01 tests updated to spy on tx.kidProfile.update after transaction wrapping changed the call path"
  - "SEC-06 uses vi.spyOn(prisma.lessonProgress, 'upsert') to verify body field isolation (CJS vi.mock limitation)"
metrics:
  duration: "7 minutes"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_modified: 9
---

# Phase 01 Plan 02: Data Integrity Security Fixes Summary

**One-liner:** HTML entity escaping via `he` library, production env var startup guard, Prisma interactive transaction for race-safe coin purchases, and req.body allowlist destructuring in progress route.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | SEC-03 HTML sanitization + SEC-04 startup guard | 807f1f7 | weeklyDigest.js, auth.js, sec03/sec04 tests |
| 2 | SEC-05 Prisma transaction + SEC-06 body destructuring | 821f6e2 | kids.js, progress.js, sec05/sec06 tests |

## What Was Built

### SEC-03: HTML Entity Escaping in Email Digests

Added `he@1.2.0` library. Created `esc()` helper function wrapping `he.escape()` with falsy fallback. Applied to:
- `kid.name` in kid card heading (with `'Your child'` fallback for undefined/empty)
- `parentName` in email greeting
- Kid names in the email subject line

Exported `buildEmailHtml` function to enable unit testing without DB dependencies.

### SEC-04: Production Startup Guard

Added module-load-time guard in `auth.js` that throws if `NODE_ENV === 'production'` and either `SUPABASE_URL` or `SUPABASE_SERVICE_KEY` is missing. Error message names the missing variable. Guard does not fire in `test` or `development` environments.

### SEC-05: Prisma Interactive Transaction for Coin Purchase

Replaced the read-then-write pattern in the store buy handler with `prisma.$transaction(async (tx) => ...)`. Inside the callback:
- Fresh read via `tx.kidProfile.findUnique` prevents stale data
- JSON parse guarded with try/catch to handle malformed `unlockedItems`
- Business rule violations (already unlocked, insufficient coins) throw errors with `.status` property
- Catch block maps `.status` errors to HTTP responses; other errors propagate to Express error handler

### SEC-06: Request Body Allowlist Destructuring

Replaced `...req.body` spread in the progress POST handler with explicit destructuring of exactly the known fields: `viewed, matchScore, traceScore, quizScore, spellingScore, phonicsScore, patternScore, oddOneOutScore, scrambleScore`. Extra fields in the request body cannot reach `upsertProgress` or the database.

## Test Results

```
Tests: 21 passed (21)
Files: 6 passed (6)
```

All security tests (SEC-01 through SEC-06) green.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SEC-03 test needed DATABASE_URL env var before import**
- **Found during:** Task 1, GREEN phase
- **Issue:** `weeklyDigest.js` imports `db.js` at module load time; `db.js` calls `new URL(rawUrl)` which throws `ERR_INVALID_URL` when `DATABASE_URL` is not set
- **Fix:** Added `process.env.DATABASE_URL` and `process.env.NODE_ENV = 'test'` at top of sec03 test before the dynamic import
- **Files modified:** server/tests/security/sec03-sanitization.test.js
- **Commit:** 807f1f7

**2. [Rule 1 - Bug] SEC-01 tests broke after SEC-05 transaction wrapping**
- **Found during:** Task 2, full security suite verification
- **Issue:** SEC-01 spy on `prisma.kidProfile.update` no longer fired because the buy handler now calls `tx.kidProfile.update` inside the transaction callback, not `prisma.kidProfile.update` directly
- **Fix:** Updated SEC-01 tests to spy on `prisma.$transaction` and expose a `txUpdateSpy` that the test can inspect for the canonical price assertion
- **Files modified:** server/tests/security/sec01-price-validation.test.js
- **Commit:** 821f6e2

**3. [Rule 1 - Bug] SEC-05 and SEC-06 tests: vi.mock() cannot intercept CJS require() at runtime**
- **Found during:** Task 2, RED phase - tests failed with real Prisma validation errors
- **Issue:** The prior wave context note ("use vi.spyOn not vi.mock for CJS") applied here: `vi.mock('../../src/lib/db', () => mockPrisma)` does not intercept CJS `require('../lib/db')` calls in route files
- **Fix:**
  - SEC-05: rewrote to use `vi.spyOn(global.prisma, '$transaction')` pattern (same as SEC-01)
  - SEC-06: rewrote to use `vi.spyOn(prisma.lessonProgress, 'upsert')` to capture the Prisma upsert call arguments (since spying on the CJS-destructured `upsertProgress` reference in the route is not possible, the test verifies the downstream Prisma call instead)
- **Files modified:** server/tests/security/sec05-transaction.test.js, server/tests/security/sec06-body-destructure.test.js
- **Commit:** 821f6e2

## Decisions Made

1. **he.escape() via esc() helper:** Centralizes the escaping logic and provides a single place to add the empty-string fallback for null/undefined values, keeping template literals readable.

2. **Module-load-time throw for startup guard:** Throwing at `require()` time (not inside `requireAuth`) ensures the server process fails fast at startup rather than silently degrading to mock auth on first request. This matches the "server startup aborted" semantics.

3. **Interactive transaction (callback form) over batch array form:** The callback form allows conditional logic inside the transaction (check-then-write), which is required for the "already unlocked" and "insufficient coins" race conditions.

4. **SEC-01 test refactor to use txUpdateSpy:** Rather than removing the price assertion (which is the core security guarantee of SEC-01), the test was updated to thread the spy through the transaction mock so the canonical price check is preserved.

5. **SEC-06 test uses prisma.lessonProgress.upsert spy:** The CJS module boundary prevents spying on the `upsertProgress` reference held inside `progress.js`. Spying on `prisma.lessonProgress.upsert` achieves the same verification goal — confirming extra fields (evilField, injected kidId) do not appear in the database write.

## Self-Check: PASSED

- server/src/services/weeklyDigest.js: FOUND
- server/src/middleware/auth.js: FOUND
- server/src/routes/kids.js: FOUND
- server/src/routes/progress.js: FOUND
- Task 1 commit 807f1f7: FOUND
- Task 2 commit 821f6e2: FOUND
- Full test suite: 21/21 passed
