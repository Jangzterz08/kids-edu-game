---
phase: 7
slug: analytics-observability
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-21
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (server) |
| **Config file** | `server/vitest.config.js` |
| **Quick run command** | `cd server && npx vitest run tests/observability/` |
| **Full suite command** | `cd server && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npx vitest run tests/observability/`
- **After every plan wave:** Run `cd server && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 (viewport) | 1 | viewport fix | manual | DevTools 375x667 — no scrollbar on `/play/:slug/game` | manual | pending |
| 7-02-01 | 02 (Sentry) | 1 | OBS-01 client | manual smoke | Browser Network tab -> `*.ingest.sentry.io` request present | manual | pending |
| 7-02-02 | 02 (Sentry) | 1 | OBS-01 server | unit | `cd server && npx vitest run tests/observability/obs01-sentry.test.js` | inline | pending |
| 7-03-01 | 03 (sessions+analytics backend) | 2 | OBS-02 heartbeat | unit | `cd server && npx vitest run tests/observability/obs02-sessions.test.js` | inline | pending |
| 7-03-02 | 03 (sessions+analytics backend) | 2 | OBS-02 analytics | unit | `cd server && npx vitest run tests/observability/obs02-analytics.test.js` | inline | pending |
| 7-04-01 | 04 (teacher analytics) | 3 | OBS-03 | unit | `cd server && npx vitest run tests/observability/obs03-analytics.test.js` | inline | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 — Inline Test Creation (Accepted)

Tests are created inline within their implementation tasks (not in a separate Wave 0 plan). This is acceptable because:

- All tests are vitest mock-based unit tests written alongside their implementation
- Each plan task that creates production code also creates the corresponding test file in the same task
- The test file is verified as part of the task's `<verify>` block

Test files created inline:
- [x] `server/tests/observability/obs01-sentry.test.js` — created in plan 02, Task 2
- [x] `server/tests/observability/obs02-sessions.test.js` — created in plan 03, Task 1
- [x] `server/tests/observability/obs02-analytics.test.js` — created in plan 03, Task 1
- [x] `server/tests/observability/obs03-analytics.test.js` — created in plan 04, Task 1

*Test pattern follows established project pattern (see `server/tests/security/sec01-price-validation.test.js`): set env vars -> import app -> use supertest -> vi.spyOn(global.prisma) for DB calls.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sentry client SDK sends events to ingest | OBS-01 | Browser SDK can't be unit-tested without real DSN | Open DevTools Network -> throw JS error -> check for request to `*.ingest.sentry.io` |
| Game fits viewport without scroll | viewport fix | CSS layout requires visual inspection | DevTools -> Responsive -> 375x667 -> navigate to any `/play/:slug/game` -> confirm no vertical scrollbar |
| Parent analytics chart renders | OBS-02 | Recharts rendering requires browser | Log in as parent -> go to `/parent/analytics` -> confirm chart shows bars for each day |
| Teacher struggling indicator | OBS-03 | Color + warning icon requires visual check | Log in as teacher -> go to classroom analytics -> confirm red cells for students with avgStars < 1.5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or inline test creation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 handled via inline test creation (accepted pattern)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** accepted (inline test creation pattern)
