---
phase: 04-parent-subscriptions
plan: 01
subsystem: server/billing
tags: [stripe, prisma, subscription, freemium, trial]
dependency_graph:
  requires: []
  provides: [subscription-schema, subscriptionUtils, trial-init, home-summary-isPremium]
  affects: [server/routes/kids.js, server/routes/auth.js, server/prisma/schema.prisma]
tech_stack:
  added: [stripe@20.4.1]
  patterns: [CJS module for shared subscription utils, Prisma migrate deploy for non-interactive envs]
key_files:
  created:
    - server/src/lib/subscriptionUtils.js
    - server/prisma/migrations/20260321000000_add_subscription_fields/migration.sql
    - server/tests/monetization/mon01-module-gating.test.js
    - server/tests/monetization/mon06-trial-init.test.js
  modified:
    - server/prisma/schema.prisma
    - server/src/routes/auth.js
    - server/src/routes/kids.js
    - server/package.json
    - server/tests/performance/perf01-home-summary.test.js
decisions:
  - "Use prisma migrate deploy (not migrate dev) for non-interactive environments — migrate dev requires a TTY"
  - "Create migration SQL manually with schema-qualified table name (kids_edu_game.User) to match Supabase pooler schema"
  - "In MON-06 test, set SUPABASE_URL='' before app import to force null supabase client and use mock user path in auth middleware"
  - "Pass Date objects (not ISO strings) to isParentPremium spy — function compares trialEndsAt > new Date() requiring a Date object"
metrics:
  duration: 7 minutes
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 9
requirements_satisfied: [MON-01, MON-06]
---

# Phase 4 Plan 1: Stripe Install, Subscription Schema, and Trial Init Summary

**One-liner:** Stripe SDK installed, User model extended with 5 subscription fields via Prisma migration, FREE_MODULE_SLUGS + isParentPremium utility created, trial init on register (create-only), and home-summary extended with isPremium boolean and subscription object.

## What Was Built

### Task 1: Prisma Migration + Stripe + subscriptionUtils + Trial Init

- **stripe@20.4.1** added to server/package.json
- **5 subscription fields** added to User model:
  - `stripeCustomerId String? @unique`
  - `stripeSubscriptionId String? @unique`
  - `subscriptionStatus String @default("none")`
  - `subscriptionEnd DateTime?`
  - `trialEndsAt DateTime?`
- **Migration `20260321000000_add_subscription_fields`** applied to Supabase DB (schema: kids_edu_game)
- **subscriptionUtils.js** exports `FREE_MODULE_SLUGS = ['alphabet', 'numbers', 'shapes']` and `isParentPremium(user)` helper
- **auth.js register route** upsert create block now sets `subscriptionStatus: 'trialing'` and `trialEndsAt: +7 days`; update block untouched (re-register safety)

### Task 2: home-summary Extension + MON-01/MON-06 Tests (TDD)

- **kids.js home-summary** extended:
  - Imports `isParentPremium` from subscriptionUtils
  - Adds 5th query to Promise.all: `prisma.user.findUnique` for parent subscription data
  - Computes `isPremium = isParentPremium(parentUser)` after Promise.all
  - Response includes `isPremium` (boolean) and `subscription: { status, trialEndsAt, subscriptionEnd }`
- **mon01-module-gating.test.js**: 5 tests — isPremium for active, trialing-future, trialing-expired, none, and subscription object shape
- **mon06-trial-init.test.js**: 2 tests — create block has trial fields, update block does not

## Test Results

```
Test Files  12 passed (12)
Tests       34 passed (34)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `prisma migrate dev` non-interactive failure**
- **Found during:** Task 1
- **Issue:** `prisma migrate dev` exits with error in non-interactive (non-TTY) environments
- **Fix:** Created migration SQL file manually, applied via `prisma migrate deploy`
- **Files modified:** `server/prisma/migrations/20260321000000_add_subscription_fields/migration.sql`
- **Commit:** daf22ec

**2. [Rule 1 - Bug] perf01 regression from new user.findUnique query in home-summary**
- **Found during:** Task 2 (full suite run)
- **Issue:** perf01-home-summary.test.js got 500 because the new `prisma.user.findUnique` call wasn't mocked
- **Fix:** Added `userFindUnique` spy returning active subscription data in perf01 beforeEach
- **Files modified:** `server/tests/performance/perf01-home-summary.test.js`
- **Commit:** 7e2293e

**3. [Rule 1 - Bug] MON-06 test got 401 — Supabase client initialized from .env**
- **Found during:** Task 2 (first GREEN run)
- **Issue:** dotenv loaded SUPABASE_URL from .env before app import; auth middleware created real supabase client; mock token `'supabase-mock-token'` was rejected
- **Fix:** Set `process.env.SUPABASE_URL = ''` and `process.env.SUPABASE_SERVICE_KEY = ''` before app import so auth middleware gets empty/falsy url → supabase = null → mock user path used
- **Files modified:** `server/tests/monetization/mon06-trial-init.test.js`
- **Commit:** 7e2293e

**4. [Rule 1 - Bug] MON-01 trialing test returned isPremium=false with ISO string dates**
- **Found during:** Task 2 (first GREEN run)
- **Issue:** `buildParentUser()` passed `futureDate.toISOString()` (string) to the spy; `isParentPremium` compares `user.trialEndsAt > new Date()` which requires a Date object
- **Fix:** Changed `buildParentUser` calls to pass `Date` objects directly instead of ISO strings
- **Files modified:** `server/tests/monetization/mon01-module-gating.test.js`
- **Commit:** 7e2293e

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.
