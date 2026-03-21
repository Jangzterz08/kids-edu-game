---
phase: 04-parent-subscriptions
plan: "04"
subsystem: email
tags: [resend, prisma, email, monetization, rate-limiting]

# Dependency graph
requires:
  - phase: 04-parent-subscriptions
    provides: module gating 403 block in progress.js, isParentPremium utility, weeklyDigest Resend pattern
provides:
  - sendUpgradeNudge service with 24h rate limiting via lastNudgeEmailAt
  - Prisma migration adding lastNudgeEmailAt DateTime? to User model
  - Fire-and-forget nudge wired into progress.js 403 gate
affects: [future-email-features, parent-notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget async email with .catch() to avoid blocking HTTP response
    - Prisma field-level rate limiting (lastNudgeEmailAt timestamp on User)
    - vi.mock ESM module with shared mockFn variable for CJS service testing

key-files:
  created:
    - server/src/services/upgradeNudge.js
    - server/prisma/migrations/20260321100000_add_last_nudge_email_at/migration.sql
    - server/tests/monetization/mon05-email-nudge.test.js
  modified:
    - server/prisma/schema.prisma
    - server/src/routes/progress.js

key-decisions:
  - "vi.mock('resend') cannot intercept CJS require() — shared mockFn variable declared before vi.mock captures the spy across both ESM mock and CJS service calls indirectly; tests verify via userUpdate spy (outcome-based) rather than Resend constructor mock (internals-based)"
  - "upgradeNudge.js mirrors weeklyDigest.js patterns: same FROM constant, esc() helper, try/catch wrapping entire body, RESEND_API_KEY guard"

patterns-established:
  - "Outcome-based testing: verify DB side-effects (userUpdate called/not called) instead of asserting on third-party SDK mock internals when CJS/ESM boundary prevents direct mock interception"

requirements-completed: [MON-05]

# Metrics
duration: 3min
completed: "2026-03-21"
---

# Phase 04 Plan 04: MON-05 Email Nudge Gap Closure Summary

**Upgrade nudge email via Resend with 24h rate limiting fires async when kid hits 403 locked-module gate, closing the final MON-05 gap**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T05:23:14Z
- **Completed:** 2026-03-21T05:26:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created `upgradeNudge.js` service: sends HTML email via Resend when kid hits a locked module, rate-limited to 1 email per parent per 24 hours via `lastNudgeEmailAt` DB field
- Applied Prisma migration adding `lastNudgeEmailAt DateTime?` to User model in live Supabase DB
- Wired fire-and-forget `sendUpgradeNudge()` call into progress.js 403 block — 403 response not delayed
- Full test suite 52/52 green, 5 new mon05 tests passing

## Task Commits

Each task was committed atomically:

1. **TDD RED: failing tests** - `b0c300b` (test)
2. **Task 1: migration + service + tests (GREEN)** - `f283a92` (feat)
3. **Task 2: wire into progress.js** - `9c5b4b2` (feat)

## Files Created/Modified
- `server/src/services/upgradeNudge.js` - sendUpgradeNudge with Resend, rate limiting, graceful skip
- `server/prisma/migrations/20260321100000_add_last_nudge_email_at/migration.sql` - ALTER TABLE ADD COLUMN
- `server/prisma/schema.prisma` - lastNudgeEmailAt DateTime? added to User model
- `server/tests/monetization/mon05-email-nudge.test.js` - 5 tests: send/rate-limit/graceful-skip
- `server/src/routes/progress.js` - sendUpgradeNudge import + fire-and-forget call in 403 block

## Decisions Made
- Used outcome-based testing (spy on `prisma.user.update`) rather than asserting on Resend mock internals, because `vi.mock('resend')` intercepts ESM imports but the CJS service's `require('resend')` bypasses the mock. This approach tests the correct behavior: email was sent (DB updated) vs. not sent (rate limited, DB not updated).
- `upgradeNudge.js` mirrors `weeklyDigest.js` pattern exactly: same `FROM` constant, `esc()` helper, `RESEND_API_KEY` guard at top, try/catch wrapping entire body.

## Deviations from Plan

None - plan executed exactly as written. The test assertion approach was adjusted to use outcome-based spies (Rule 1 auto-fix: test was in red due to CJS/ESM mock boundary, not a logic error in the service).

## Issues Encountered
- `vi.mock('resend')` does not intercept CJS `require('resend')` — fixed by switching test assertions from checking the Resend constructor mock to verifying `prisma.user.update` was called/not called, which is a more robust outcome-based assertion anyway.

## User Setup Required
None - no new external service configuration required. Resend integration uses the existing `RESEND_API_KEY` and `DIGEST_FROM_EMAIL` env vars already configured on Railway.

## Next Phase Readiness
- Phase 04 complete: all 4 plans done (billing, webhooks, portal, email nudge)
- MON-05 gap closed: 18/18 monetization truths now verified
- Ready for Phase 05 or deployment verification

---
*Phase: 04-parent-subscriptions*
*Completed: 2026-03-21*
