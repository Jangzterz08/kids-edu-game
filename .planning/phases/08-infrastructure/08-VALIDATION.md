---
phase: 8
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `server/vitest.config.js` |
| **Quick run command** | `cd server && npx vitest run tests/adaptive/` |
| **Full suite command** | `cd server && npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npx vitest run tests/adaptive/`
- **After every plan wave:** Run `cd server && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 08-01 | 1 | INFRA-01 | unit (progressSync mock) | `cd server && npx vitest run tests/adaptive/infra01-score-fields.test.js` | ❌ W0 | ⬜ pending |
| 08-01-02 | 08-01 | 1 | INFRA-02 | unit (progressSync mock) | `cd server && npx vitest run tests/adaptive/infra01-score-fields.test.js` | ❌ W0 | ⬜ pending |
| 08-02-01 | 08-02 | 2 | INFRA-03 | integration (POST route mock) | `cd server && npx vitest run tests/adaptive/infra01-score-fields.test.js` | ❌ W0 | ⬜ pending |
| 08-02-02 | 08-02 | 2 | INFRA-04 | unit (route mock via spyOnPrisma) | `cd server && npx vitest run tests/adaptive/infra02-stats-endpoint.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/adaptive/infra01-score-fields.test.js` — tests for INFRA-01 (DB columns accept non-null values), INFRA-02 (SCORE_FIELDS contains all 11 fields, computeStars with new fields), and INFRA-03 (POST progress with new score field, verify DB persists it via mocked tx)
- [ ] `server/tests/adaptive/infra02-stats-endpoint.test.js` — tests for INFRA-04: GET /api/progress/:kidId/stats returns `sortScore`, `trueFalseScore`, `memoryMatchScore` keys in `gameAccuracy` using `spyOnPrisma` pattern from `tests/helpers/setup.js`

*Existing infrastructure (`server/tests/helpers/setup.js`, `spyOnPrisma` pattern) covers all fixtures needed — no new conftest or framework install required.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
