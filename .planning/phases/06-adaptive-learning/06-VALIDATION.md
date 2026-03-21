---
phase: 6
slug: adaptive-learning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `server/vitest.config.js` |
| **Quick run command** | `npx vitest run server/tests/adaptive/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run server/tests/adaptive/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | ADL-01 | unit | `npx vitest run server/tests/adaptive/adl01-difficulty-write.test.js` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | ADL-01 | unit | `npx vitest run server/tests/adaptive/adl01-difficulty-write.test.js` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | ADL-01 | unit | `npx vitest run server/tests/adaptive/adl01-sm2-review.test.js` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | ADL-02 | unit | `npx vitest run server/tests/adaptive/adl02-recommendations.test.js` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 3 | ADL-02 ADL-03 | unit | `npx vitest run server/tests/adaptive/adl02-recommendations.test.js server/tests/adaptive/adl03-review-today.test.js` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 4 | ADL-02 ADL-03 | visual | manual | n/a | ⬜ pending |
| 06-04-02 | 04 | 4 | ADL-02 ADL-03 | visual | manual | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/adaptive/adl01-difficulty-write.test.js` — stubs for ADL-01 (ModuleDifficulty upsert triggered by lesson save, age-adjusted thresholds)
- [ ] `server/tests/adaptive/adl01-sm2-review.test.js` — stubs for ADL-01 (ReviewSchedule creation on first <threshold score, SM-2 update on re-attempt)
- [ ] `server/tests/adaptive/adl02-recommendations.test.js` — stubs for ADL-02 (home-summary returns recommendations[], fallback to untried modules)
- [ ] `server/tests/adaptive/adl03-review-today.test.js` — stubs for ADL-03 (home-summary returns reviewToday[], only dueDate ≤ today)

*Existing test infrastructure (vitest, helpers/setup.js) covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recommended section renders above module grid on KidHome | ADL-02 | React UI visual layout | Start dev servers, log in as kid, complete 2-3 lessons in different modules, navigate to KidHome, verify "⭐ Recommended for You" section appears above module grid |
| Review Today shows lesson cards with correct lesson names | ADL-03 | React UI visual layout | Complete a lesson with score <60%, navigate to KidHome next day (or manually set dueDate to yesterday in DB), verify "🔁 Review Today" section appears between Recommended and module grid |
| Age group affects which modules appear as recommendations | ADL-02 | Requires real kid profile with ageGroup set | Create kids with different ageGroups (3-4, 5-6, 7-8), complete same modules with same scores, verify recommended sections differ |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 8s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
