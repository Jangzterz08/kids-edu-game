---
phase: 04-parent-subscriptions
plan: 02
subsystem: server/billing
tags: [stripe, express, webhook, checkout, portal, prisma, subscription, freemium, module-gating]

requires:
  - phase: 04-parent-subscriptions
    plan: 01
    provides: [subscriptionUtils, FREE_MODULE_SLUGS, isParentPremium, subscription-schema]

provides:
  - Stripe Checkout session creation (monthly/annual price validation)
  - Stripe webhook handler (checkout.session.completed, customer.subscription.deleted, invoice.payment_failed)
  - Stripe Customer Portal session creation
  - server-side module gating in progress route (locked modules return 403 for non-premium parents)

affects: [04-parent-subscriptions-plan-03, client-billing-integration]

tech-stack:
  added: []
  patterns:
    - "CJS module exposes internal stripe instance (module.exports.stripe) for test spying"
    - "Tests use createRequire(import.meta.url) to get same CJS instance as app — ESM dynamic import creates separate instance"
    - "Stripe webhook mounted before express.json() using express.raw({ type: 'application/json' })"
    - "stripe fallback key (sk_test_placeholder) prevents startup failure in non-billing test files"

key-files:
  created:
    - server/src/routes/billing.js
    - server/tests/monetization/mon02-checkout-session.test.js
    - server/tests/monetization/mon03-webhook-handler.test.js
    - server/tests/monetization/mon04-portal.test.js
  modified:
    - server/src/index.js
    - server/src/routes/progress.js
    - server/tests/monetization/mon01-module-gating.test.js

key-decisions:
  - "Expose stripe instance via module.exports.stripe for test spying — billing.js internal closure instance differs from ESM import"
  - "Use createRequire(import.meta.url) in tests to get CJS-cached module matching what index.js loaded"
  - "Stripe fallback key 'sk_test_placeholder' in billing.js prevents Error at module load for non-billing test files that don't set STRIPE_SECRET_KEY"
  - "Module gate uses kid.parentId to look up parent; kid token auth makes parentId available from kidProfile"

requirements-completed: [MON-02, MON-03, MON-04]

duration: 9min
completed: "2026-03-21"
---

# Phase 4 Plan 2: Stripe Billing Routes and Module Gating Summary

**Stripe Checkout/webhook/portal routes with server-side module gating rejecting locked-content progress writes for non-premium parents.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-21T01:31:00Z
- **Completed:** 2026-03-21T01:40:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- **billing.js** with three endpoints: POST /checkout (validates priceId, builds session with customer vs customer_email logic), POST /webhook (verifies Stripe signature, handles 3 event types), GET /portal (returns portal URL or 400 if no stripeCustomerId)
- **Webhook wired before express.json()** in index.js using `express.raw({ type: 'application/json' })` — required for Stripe signature verification
- **Module gate in progress route** — locked modules return 403 for non-premium parents; free modules (alphabet, numbers, shapes) always pass regardless of subscription
- All 47 tests pass (15 test files), including 10 new billing tests and 3 new module gate tests

## Task Commits

1. **Task 1 RED: Failing tests for checkout, webhook, portal** - `06cd4cc` (test)
2. **Task 1 GREEN: billing.js + index.js wiring** - `467d6d1` (feat)
3. **Task 2 RED: Failing progress gate tests** - `47cddd0` (test)
4. **Task 2 GREEN: Module gate in progress.js** - `f73bd72` (feat)

## Files Created/Modified

- `server/src/routes/billing.js` - Checkout session, webhook handler, billing portal
- `server/src/index.js` - Webhook before express.json(), billing router registered
- `server/src/routes/progress.js` - Module gate with FREE_MODULE_SLUGS check
- `server/tests/monetization/mon02-checkout-session.test.js` - 4 tests for checkout
- `server/tests/monetization/mon03-webhook-handler.test.js` - 4 tests for webhook events + invalid sig
- `server/tests/monetization/mon04-portal.test.js` - 2 tests for portal
- `server/tests/monetization/mon01-module-gating.test.js` - 3 new tests for progress gate (8 total)

## Decisions Made

- **Expose stripe instance via `module.exports.stripe`**: billing.js creates stripe at module load via `require('stripe')(key)`. ESM `await import()` in tests creates a separate instance from CJS `require()`. The spy on the ESM instance never intercepts calls in the route. Solution: expose `module.exports.stripe = stripe` and use `createRequire(import.meta.url)` in tests to get the same cached CJS instance.
- **Stripe fallback key**: `require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')` prevents Stripe from throwing "Neither apiKey nor config.authenticator provided" when non-billing test files load index.js without setting STRIPE_SECRET_KEY.
- **Module gate looks up parent by ID**: The progress route gate uses `prisma.user.findUnique({ where: { id: kid.parentId } })` — kid.parentId is always set for kid-token auth paths since `resolveWriteAccess` returns the full kidProfile.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe spy interception failure — ESM/CJS module split**
- **Found during:** Task 1 (GREEN phase — first test run)
- **Issue:** `await import('../../src/routes/billing.js')` in tests creates a different module instance than `require('./routes/billing')` used by index.js. Spy on test instance never intercepts route calls. `checkoutCreate called? 0` despite spy being set.
- **Fix:** (a) Expose `module.exports.stripe = stripe` from billing.js. (b) Use `createRequire(import.meta.url)` in all three test files to obtain the CJS-cached module. (c) Add `sk_test_placeholder` fallback so non-billing tests don't crash on module load.
- **Files modified:** `server/src/routes/billing.js`, all three mon02/03/04 test files
- **Verification:** All 10 new tests pass, `checkoutCreate called? 1` confirmed
- **Committed in:** `467d6d1` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was necessary for tests to be meaningful. No scope creep.

## Issues Encountered

None beyond the ESM/CJS spy issue documented above.

## Next Phase Readiness

- Billing lifecycle complete: subscribe, receive events, manage billing all functional
- Module gating enforced server-side — client-side gating in Plan 03 can mirror this
- Plan 03 (parent dashboard UI) can use `/api/billing/checkout` and `/api/billing/portal` endpoints directly

---
*Phase: 04-parent-subscriptions*
*Completed: 2026-03-21*
