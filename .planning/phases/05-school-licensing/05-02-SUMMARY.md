---
phase: 05-school-licensing
plan: 02
subsystem: server/billing+school
tags: [stripe, school-licensing, billing, webhook, seat-cap, b2b]
dependency_graph:
  requires: [05-01]
  provides: [schoolBilling.js, school.js, extended billing.js webhook]
  affects: [server/src/routes/, server/src/index.js, server/tests/school/]
tech_stack:
  added: []
  patterns: [CJS-exports-for-test-spy, prisma-transaction-seat-cap, school-first-webhook-routing]
key_files:
  created:
    - server/src/routes/schoolBilling.js
    - server/src/routes/school.js
    - server/tests/school/sch02-school-checkout.test.js
    - server/tests/school/sch03-seat-allocation.test.js
    - server/tests/school/sch05-invoices.test.js
    - server/tests/school/sch06-school-webhook.test.js
  modified:
    - server/src/routes/billing.js
    - server/src/index.js
    - server/tests/monetization/mon03-webhook-handler.test.js
key_decisions:
  - schoolBilling.js exports module.exports.stripe for CJS spy access in tests (mirrors billing.js pattern)
  - Seat cap check and schoolTeacher.create wrapped in prisma.$transaction to prevent race conditions under concurrent requests
  - Webhook routes school events by checking schoolId metadata (checkout) or findFirst by subscriptionId/customerId (deletion/payment_failed) before falling through to parent handler
  - mon03 parent webhook tests needed school.findFirst null mock added after webhook extension to prevent 500 errors
metrics:
  duration_seconds: 366
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_created: 6
  files_modified: 3
---

# Phase 05 Plan 02: School Billing Routes + Webhook Extension Summary

**One-liner:** Stripe school checkout with tier-based seat licensing, teacher provisioning with transaction-safe seat cap enforcement, and school-aware webhook handler extension.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | School billing + provisioning routes + index.js wiring | b5f0dc8 | schoolBilling.js, school.js, billing.js, index.js |
| 2 | Tests for SCH-02, SCH-03, SCH-05, SCH-06 | e0c4209 | sch02/03/05/06 test files, mon03 fix |

## What Was Built

### schoolBilling.js
- `POST /api/billing/school-checkout`: Resolves tier (tier_1/tier_2/tier_3) to Stripe Price ID via env vars; creates Stripe Checkout session with `metadata.schoolId` and `metadata.seatCount`; uses existing `stripeCustomerId` if present
- `GET /api/billing/school-status`: Returns license state, seatCount, seatsUsed, isLicensed for the admin's school
- `GET /api/billing/school-invoices`: Lists Stripe invoices for school's customer ID; maps to clean response with `invoicePdf` field

### school.js
- `POST /api/school`: Creates school with nested teacher admin record; rejects if teacher already belongs to a school
- `GET /api/school/me`: Admin dashboard data with seatsUsed count
- `GET /api/school/teachers`: Lists all teachers with classroom counts
- `POST /api/school/teachers`: Adds teacher by email with transaction-safe seat cap enforcement (throws SEAT_CAP_REACHED inside `$transaction`)
- `DELETE /api/school/teachers/:userId`: Removes teacher (cannot remove self)

### billing.js webhook extension
- `checkout.session.completed`: Checks `schoolId` metadata first — updates School with `licenseStatus: 'active'`, `stripeCustomerId`, `stripeSubscriptionId`, and `seatCount`; falls through to userId parent handler
- `customer.subscription.deleted`: Calls `school.findFirst({ stripeSubscriptionId })` first; if found updates school with `licenseStatus: 'expired'`; else parent `user.updateMany`
- `invoice.payment_failed`: Calls `school.findFirst({ stripeCustomerId })` first; if found updates school with `licenseStatus: 'past_due'`; else parent `user.updateMany`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] mon03 webhook tests broke after billing.js extension**
- **Found during:** Task 2 (full test suite run)
- **Issue:** The new `customer.subscription.deleted` and `invoice.payment_failed` webhook cases now call `prisma.school.findFirst()` before the parent path. The mon03 tests did not mock `school.findFirst`, causing Prisma to throw "Invalid invocation" and return 500.
- **Fix:** Added `vi.spyOn(prisma.school, 'findFirst').mockResolvedValue(null)` to mon03's `beforeEach` so the parent flow runs as expected.
- **Files modified:** server/tests/monetization/mon03-webhook-handler.test.js
- **Commit:** e0c4209

## Test Results

- `npx vitest run tests/school/`: 32 passed, 3 todo (35 total), 1 skipped — all pass
- `npx vitest run` (full suite): 84 passed, 3 todo (87 total), 1 skipped — all pass

## Self-Check: PASSED

- server/src/routes/schoolBilling.js: FOUND
- server/src/routes/school.js: FOUND
- server/tests/school/sch02-school-checkout.test.js: FOUND
- server/tests/school/sch03-seat-allocation.test.js: FOUND
- server/tests/school/sch05-invoices.test.js: FOUND
- server/tests/school/sch06-school-webhook.test.js: FOUND
- Commit b5f0dc8: FOUND
- Commit e0c4209: FOUND
