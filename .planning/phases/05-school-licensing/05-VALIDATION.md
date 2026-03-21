---
phase: 5
slug: school-licensing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | server/vitest.config.js |
| **Quick run command** | `npx vitest run --reporter=verbose 2>&1 \| tail -5` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose 2>&1 | tail -5`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | SCH-01 | unit | `npx vitest run server/tests/school/sch01-license-purchase.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | SCH-02 | unit | `npx vitest run server/tests/school/sch02-seat-provisioning.test.js` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | SCH-03 | unit | `npx vitest run server/tests/school/sch03-content-unlock.test.js` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | SCH-04 | unit | `npx vitest run server/tests/school/sch04-admin-dashboard.test.js` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | SCH-05 | unit | `npx vitest run server/tests/school/sch05-license-expiry.test.js` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | SCH-06 | unit | `npx vitest run server/tests/school/sch06-invoice-history.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/school/sch01-license-purchase.test.js` — stubs for SCH-01
- [ ] `server/tests/school/sch02-seat-provisioning.test.js` — stubs for SCH-02
- [ ] `server/tests/school/sch03-content-unlock.test.js` — stubs for SCH-03
- [ ] `server/tests/school/sch04-admin-dashboard.test.js` — stubs for SCH-04
- [ ] `server/tests/school/sch05-license-expiry.test.js` — stubs for SCH-05
- [ ] `server/tests/school/sch06-invoice-history.test.js` — stubs for SCH-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Checkout school seat purchase redirect | SCH-01 | Requires live Stripe test keys and browser redirect | Create school, click upgrade, complete Stripe test checkout (card 4242...), verify school `licenseStatus: active` in DB |
| School admin invoice download | SCH-06 | Requires Stripe portal session with invoice history | Log in as school admin, open billing portal, verify invoice list renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
