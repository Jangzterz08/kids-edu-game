---
phase: 4
slug: parent-subscriptions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client) / jest or supertest (server) |
| **Config file** | `client/vitest.config.ts` / `server/package.json` |
| **Quick run command** | `cd server && npm test -- --testPathPattern billing` |
| **Full suite command** | `cd server && npm test && cd ../client && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npm test -- --testPathPattern billing`
- **After every plan wave:** Run `cd server && npm test && cd ../client && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | MON-01 | manual | Stripe Dashboard setup | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | MON-01 | unit | `npm test -- --testPathPattern billing` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | MON-02 | integration | `npm test -- --testPathPattern webhook` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | MON-03 | e2e | manual Stripe Checkout flow | manual | ⬜ pending |
| 04-04-01 | 04 | 2 | MON-04 | unit | `npm test -- --testPathPattern access` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | MON-05 | e2e | manual paywall UI flow | manual | ⬜ pending |
| 04-06-01 | 06 | 3 | MON-06 | e2e | manual billing portal flow | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/billing.test.js` — stubs for MON-01, MON-02
- [ ] `server/tests/webhook.test.js` — stubs for MON-02 webhook events
- [ ] `server/tests/access.test.js` — stubs for MON-03, MON-04 access gating
- [ ] `npm install stripe@20.4.1` — Stripe SDK installation in server/

*Wave 0 installs and stubs must pass before Wave 1 tasks begin.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Checkout completes and unlocks access | MON-03 | Requires live Stripe test mode + browser | 1. Use test card 4242... 2. Complete checkout 3. Verify modules unlock immediately |
| Paywall screen shown to locked kid | MON-05 | Requires authenticated kid session + UI | 1. Log in as kid of expired-trial parent 2. Tap module 4 3. Verify paywall screen renders |
| Billing portal cancel updates subscription | MON-06 | Requires live Stripe Customer Portal | 1. Log in as subscribed parent 2. Navigate to billing 3. Cancel via portal 4. Verify status change |
| Trial countdown visible in parent dashboard | MON-01 | UI behavior only | 1. Register new parent 2. Verify trial badge shows days remaining |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
