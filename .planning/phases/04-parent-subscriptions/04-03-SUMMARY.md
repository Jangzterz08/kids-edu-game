---
phase: 04-parent-subscriptions
plan: "03"
subsystem: ui
tags: [stripe, react, subscription, freemium, billing]

# Dependency graph
requires:
  - phase: 04-parent-subscriptions plan 01
    provides: home-summary endpoint with isPremium + subscription fields
  - phase: 04-parent-subscriptions plan 02
    provides: billing API routes (checkout, portal, webhook)
provides:
  - SubscriptionSection component in ParentDashboard with all subscription states
  - Plan picker UI (monthly/annual) with Stripe Checkout redirect
  - Locked ModuleCard overlay in KidHome for non-premium parents
  - Checkout success/cancel toast notifications
affects: [future-ui-phases, parent-onboarding, marketing-funnel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Subscription state derived from home-summary API response (no dedicated subscription endpoint)
    - URL query param detection for post-checkout state (?checkout=success/cancel)
    - Default isPremium=true to prevent flash of locked modules during API load
    - Inline styles object pattern (subscriptionStyles) consistent with existing ParentDashboard style

key-files:
  created: []
  modified:
    - client/src/pages/ParentDashboard.jsx
    - client/src/pages/KidHome.jsx
    - server/src/routes/billing.js

key-decisions:
  - "Subscription state loaded from home-summary of first kid rather than a dedicated /api/subscription endpoint — avoids an extra round trip; parents always have at least one kid"
  - "isPremium defaults to true in KidHome state to prevent flash of incorrectly locked modules while API loads"
  - "Billing checkout API updated to accept { plan: 'monthly' | 'annual' } names instead of raw Stripe price IDs — price IDs remain server-side env vars, never exposed to client"

patterns-established:
  - "Plan name → priceId mapping in PLAN_TO_PRICE server object: client sends human-readable plan name, server resolves to Stripe price ID"
  - "URL query param cleanup after checkout redirect: window.history.replaceState removes ?checkout= param after toast fires"

requirements-completed: [MON-05]

# Metrics
duration: 45min
completed: 2026-03-21
---

# Phase 4 Plan 03: Parent Subscription UI Summary

**SubscriptionSection in ParentDashboard with four state-aware banners (trialing/none/active/past_due), monthly/annual plan picker with Stripe Checkout redirect, and KidHome locked ModuleCard overlay at 0.45 opacity for non-premium parents**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-21T01:40:00Z
- **Completed:** 2026-03-21T02:25:00Z
- **Tasks:** 3 (2 auto + 1 human-verify)
- **Files modified:** 3

## Accomplishments

- ParentDashboard shows contextual subscription UI for all four states: trialing (countdown banner), none/canceled (upgrade banner), active (plan status + billing management), past_due (payment alert)
- Plan picker renders Monthly ($4.99/mo) and Annual ($39.99/yr) glass cards with radio selection, "Best value" badge on Annual, and accessible radiogroup markup
- KidHome locks modules 4-13 at 0.45 opacity with pointer-events none and a lock icon for non-premium parents; free modules (alphabet, numbers, shapes) always render normally
- Checkout flow posts `{ plan }` to `/api/billing/checkout`, redirects to Stripe, and shows toast on return via URL query param detection
- Billing portal accessible from active subscriber view via `GET /api/billing/portal` with window.open to new tab

## Task Commits

Each task was committed atomically:

1. **Task 1: SubscriptionSection + billing checkout update** - `deb7184` (feat)
2. **Task 2: Locked ModuleCard overlay in KidHome** - `a3308fb` (feat)
3. **Task 3: Human verification** - approved (no code commit)

**Fix commit:** `9ab7c36` — updated mon02 tests to use plan name instead of priceId (auto-fix for test alignment after billing.js API change)

## Files Created/Modified

- `client/src/pages/ParentDashboard.jsx` — SubscriptionSection component with state-aware banners, PlanPicker with monthly/annual cards, handleCheckout and handleManageBilling handlers, toast on checkout success/cancel
- `client/src/pages/KidHome.jsx` — FREE_MODULE_SLUGS constant, isPremium state (defaults true), isLocked computed per module, lock overlay on card wrapper with aria-disabled and aria-label
- `server/src/routes/billing.js` — Replaced `VALID_PRICE_IDS` + raw `priceId` input with `PLAN_TO_PRICE` mapping; accepts `{ plan: 'monthly' | 'annual' }` from client

## Decisions Made

- Billing checkout accepts plan name instead of Stripe price ID: client sends `'monthly'` or `'annual'`, server maps to `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` env vars. Price IDs never leak to the browser.
- Subscription data loaded from the first kid's home-summary response rather than a new endpoint. Avoids a redundant API call; every parent account has at least one kid.
- `isPremium` defaults to `true` in KidHome to eliminate the flash where all modules briefly appear locked during initial load.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated mon02 tests to use plan name instead of priceId**
- **Found during:** Task 1 (billing.js checkout API change)
- **Issue:** Existing mon02 tests sent `{ priceId }` in checkout request body; after billing.js was updated to require `{ plan }`, the tests would have failed with "Invalid plan"
- **Fix:** Updated test fixtures to send `{ plan: 'monthly' }` / `{ plan: 'annual' }` matching the new API contract
- **Files modified:** server/src/tests/mon02.test.js (inferred from commit message)
- **Verification:** Commit `9ab7c36` confirms tests pass after fix
- **Committed in:** `9ab7c36`

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix necessary to keep test suite passing after planned API contract change. No scope creep.

## Issues Encountered

None beyond the test alignment fix above.

## User Setup Required

None — Stripe env vars (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`) were already required from Plan 02. No new external service configuration required for this plan.

## Next Phase Readiness

- Full subscription UI is complete end-to-end: parent can see status, pick a plan, start checkout, and manage billing
- KidHome locked state is in place for the freemium gate
- Phase 04 is now fully complete (plans 01, 02, 03 all done)
- Ready to proceed to Phase 05 or any subsequent phase

---
*Phase: 04-parent-subscriptions*
*Completed: 2026-03-21*
