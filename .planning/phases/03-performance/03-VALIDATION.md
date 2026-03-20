---
phase: 3
slug: performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | server/vitest.config.js |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PERF-01 | integration | `npx vitest run server/tests/performance/perf01-home-summary.test.js` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PERF-02 | integration | `npx vitest run server/tests/performance/perf02-transaction.test.js` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | PERF-03 | integration | `npx vitest run server/tests/performance/perf03-stats-concurrent.test.js` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | PERF-04 | unit | `npx vitest run server/tests/performance/perf04-digest-batch.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/performance/perf01-home-summary.test.js` — test single endpoint returns all KidHome data
- [ ] `server/tests/performance/perf02-transaction.test.js` — test lesson save uses single transaction
- [ ] `server/tests/performance/perf03-stats-concurrent.test.js` — test stats endpoint runs queries concurrently
- [ ] `server/tests/performance/perf04-digest-batch.test.js` — test digest sends in batches of 10

*Existing Vitest infrastructure covers framework needs — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| KidHome perceived load time | PERF-01 | Requires browser network tab | Open KidHome, verify single XHR to /home-summary |
| Digest email delivery | PERF-04 | Requires Resend API | Trigger cron, verify emails sent in batches in Resend dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
