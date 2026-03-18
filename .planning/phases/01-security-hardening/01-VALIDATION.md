---
phase: 1
slug: security-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x + Supertest 7.x |
| **Config file** | `server/vitest.config.js` — does not exist yet (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose tests/security/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/security/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | W0 | 0 | SEC-01–06 | infra | `cd server && npx vitest run tests/security/` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | SEC-01 | integration | `npx vitest run tests/security/sec01-price-validation.test.js` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | SEC-02 | integration | `npx vitest run tests/security/sec02-rate-limit.test.js` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | SEC-03 | unit | `npx vitest run tests/security/sec03-sanitization.test.js` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | SEC-04 | unit | `npx vitest run tests/security/sec04-startup-guard.test.js` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | SEC-05 | integration | `npx vitest run tests/security/sec05-transaction.test.js` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 2 | SEC-06 | integration | `npx vitest run tests/security/sec06-body-destructure.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/vitest.config.js` — Vitest config for Node/CommonJS environment
- [ ] `server/tests/helpers/setup.js` — shared test helpers (mock Prisma client, app export)
- [ ] `server/tests/security/sec01-price-validation.test.js` — stubs for SEC-01
- [ ] `server/tests/security/sec02-rate-limit.test.js` — stubs for SEC-02
- [ ] `server/tests/security/sec03-sanitization.test.js` — stubs for SEC-03
- [ ] `server/tests/security/sec04-startup-guard.test.js` — stubs for SEC-04 (uses `vi.resetModules()`)
- [ ] `server/tests/security/sec05-transaction.test.js` — stubs for SEC-05
- [ ] `server/tests/security/sec06-body-destructure.test.js` — stubs for SEC-06
- [ ] `cd server && npm install --save-dev vitest@3 supertest@7` — framework install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Railway healthcheck fails if SUPABASE_URL missing in prod | SEC-04 | Cannot simulate Railway deploy in test | Remove SUPABASE_URL from Railway env → check deploy fails with non-zero exit code |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
