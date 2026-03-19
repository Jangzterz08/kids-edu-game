---
phase: 01-security-hardening
plan: 01
subsystem: testing
tags: [vitest, supertest, express-rate-limit, prisma, jwt, security]

# Dependency graph
requires: []
provides:
  - Vitest + Supertest test infrastructure for Node/CommonJS server
  - STORE_ITEMS canonical price map in kids.js (8 items, price authority on server)
  - express-rate-limit on /api/auth/kid-lookup and /api/auth/kid-login (10 req/min)
  - 6 test stub files for SEC-01 through SEC-06
  - Documented CJS mocking strategy using global.prisma vi.spyOn
affects: [02-security-hardening, monetization, auth]

# Tech tracking
tech-stack:
  added:
    - vitest@3 (test runner)
    - supertest@7 (HTTP assertions)
    - express-rate-limit@8.3.1 (brute-force protection)
  patterns:
    - CJS mocking: use vi.spyOn(global.prisma.model, 'method') after app import (vi.mock does not intercept CJS require())
    - Kid auth in tests: sign real JWT with TEST_KID_SECRET (set before dotenv loads) to use kid JWT path in auth.js
    - TDD stub files: create all test files with it.todo() first; vitest skips todos (exit 0)

key-files:
  created:
    - server/vitest.config.js
    - server/tests/helpers/setup.js
    - server/tests/security/sec01-price-validation.test.js
    - server/tests/security/sec02-rate-limit.test.js
    - server/tests/security/sec03-sanitization.test.js
    - server/tests/security/sec04-startup-guard.test.js
    - server/tests/security/sec05-transaction.test.js
    - server/tests/security/sec06-body-destructure.test.js
  modified:
    - server/package.json (added vitest, supertest, express-rate-limit; test scripts)
    - server/src/routes/kids.js (STORE_ITEMS map; server-side price enforcement)
    - server/src/index.js (trust proxy; kidAuthLimiter on kid auth endpoints)

key-decisions:
  - "Use vi.spyOn(global.prisma) not vi.mock() for CJS server: Vitest mocks ESM imports but cannot intercept CJS require() at runtime. global.prisma singleton (set by lib/db.js) is accessible after app import, so vi.spyOn works reliably."
  - "Use real kid JWT signed with TEST_KID_SECRET for auth in tests: avoids needing to mock Supabase client; auth.js kid-JWT path uses only KID_JWT_SECRET env var (no network call)."
  - "express-rate-limit 8.3.1 pinned (latest stable): trust proxy set to 1 for Railway reverse proxy."
  - "STORE_ITEMS map in kids.js (not a DB table): prices are static config, not user data; no migration needed."

patterns-established:
  - "CJS spyOn pattern: const prisma = global.prisma; vi.spyOn(prisma.model, 'method').mockResolvedValue(...);"
  - "Test JWT pattern: set KID_JWT_SECRET before import; jwt.sign({ sub, type: 'kid' }, secret) in test file."

requirements-completed: [SEC-01, SEC-02]

# Metrics
duration: 12min
completed: 2026-03-19
---

# Phase 01 Plan 01: Security Hardening — Test Infrastructure + SEC-01/SEC-02 Summary

**Vitest test harness with vi.spyOn(global.prisma) pattern; STORE_ITEMS canonical price map closes price-manipulation attack; express-rate-limit at 10 req/min closes PIN brute-force on kid auth endpoints.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-19T03:45:29Z
- **Completed:** 2026-03-19T03:57:39Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Test infrastructure operational: Vitest 3 + Supertest 7 installed, vitest.config.js created, 6 security test stub files with 21 .todo() placeholders run with exit 0
- SEC-01 closed: `STORE_ITEMS` canonical price map added to kids.js; buy handler ignores client-supplied `price` field entirely; 4 integration tests green
- SEC-02 closed: `express-rate-limit` applied to `/api/auth/kid-lookup` and `/api/auth/kid-login` at 10 req/min; 3 integration tests green
- Discovered and documented CJS mocking constraint: `vi.mock()` intercepts ESM imports only; CJS `require()` bypasses it — workaround is `vi.spyOn(global.prisma)` which works reliably for the singleton pattern

## Task Commits

1. **Task 1: Install test framework + 6 stub files** - `12e00f3` (chore)
2. **Task 2: SEC-01 + SEC-02 implementation (TDD green)** - `0370c12` (feat)

## Files Created/Modified

- `server/vitest.config.js` - Vitest config with node environment, includes tests/**/*.test.js
- `server/tests/helpers/setup.js` - CJS mocking strategy documentation + helper exports (getTestKidToken, spyOnPrisma)
- `server/tests/security/sec01-price-validation.test.js` - 4 real integration tests for price validation (all green)
- `server/tests/security/sec02-rate-limit.test.js` - 3 real integration tests for rate limiting (all green)
- `server/tests/security/sec03-sanitization.test.js` - 5 .todo() stubs (deferred to plan 02)
- `server/tests/security/sec04-startup-guard.test.js` - 4 .todo() stubs (deferred to plan 02)
- `server/tests/security/sec05-transaction.test.js` - 3 .todo() stubs (deferred to plan 02)
- `server/tests/security/sec06-body-destructure.test.js` - 2 .todo() stubs (deferred to plan 02)
- `server/src/routes/kids.js` - Added STORE_ITEMS map; replaced `{ itemId, price } = req.body` with server-authoritative price lookup
- `server/src/index.js` - Added express-rate-limit require; app.set('trust proxy', 1); kidAuthLimiter applied to kid auth endpoints
- `server/package.json` - Added vitest, supertest (devDeps); express-rate-limit (dep); test + test:security scripts

## Decisions Made

- `vi.mock()` does not intercept CJS `require()` in Vitest. The server is fully CJS (`"type": "commonjs"`). The `lib/db.js` module uses a `global.prisma` singleton. After importing the app, `global.prisma` is populated and `vi.spyOn` on its methods works for all tests.
- Kid JWT for auth bypass: setting `KID_JWT_SECRET` before the app import (dotenv won't override pre-set vars) lets tests sign real tokens that pass auth.js's `verifyKidToken()` path without network calls to Supabase.
- `express-rate-limit@8.3.1` pinned at latest stable. `trust proxy: 1` required for Railway (requests arrive via reverse proxy so IP header is `X-Forwarded-For`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESM import syntax required in test files**
- **Found during:** Task 1 (stub file creation)
- **Issue:** Plan specified `const { describe, it } = require('vitest')` but Vitest 3 throws "Vitest cannot be imported in a CommonJS module using require()" — even in CJS packages, vitest test files must use ESM import syntax.
- **Fix:** Used `import { describe, it } from 'vitest'` in all test files and `import { defineConfig } from 'vitest/config'` in vitest.config.js.
- **Files modified:** vitest.config.js, all 6 test stub files, setup.js
- **Verification:** All 6 stubs pass with exit 0
- **Committed in:** 12e00f3 (Task 1 commit)

**2. [Rule 1 - Bug] vi.mock() does not intercept CJS require() — switched to vi.spyOn(global.prisma)**
- **Found during:** Task 2 (TDD RED/GREEN phases)
- **Issue:** `vi.mock('../../src/lib/db', factory)` intercepts ESM imports but not CJS `require()`. The route files use `require('../lib/db')`, so the real Prisma client was called (throwing "Invalid prisma invocation" with no DB).
- **Fix:** Import app first to initialise `global.prisma`, then use `vi.spyOn(global.prisma.model, 'method').mockResolvedValue(...)` in tests.
- **Files modified:** sec01-price-validation.test.js, tests/helpers/setup.js
- **Verification:** 4 SEC-01 tests pass with mocked prisma calls verified via spy
- **Committed in:** 0370c12 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes required for test infrastructure to function. No scope creep.

## Issues Encountered

- Real `.env` file loaded by dotenv had real Supabase credentials, causing auth to validate tokens against Supabase. Resolved by using real kid JWTs signed with `KID_JWT_SECRET` (set before app import so dotenv does not override).

## Next Phase Readiness

- Test infrastructure ready for SEC-03 through SEC-06 (plans 02 onward)
- SEC-01 and SEC-02 closed — price manipulation and PIN brute-force vectors eliminated
- `global.prisma` spy pattern documented in `tests/helpers/setup.js` for use in subsequent test plans

---
*Phase: 01-security-hardening*
*Completed: 2026-03-19*
