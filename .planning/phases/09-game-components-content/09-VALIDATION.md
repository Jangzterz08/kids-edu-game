---
phase: 9
slug: game-components-content
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (client/vitest.config.js) |
| **Config file** | client/vitest.config.js |
| **Quick run command** | `cd client && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd client && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd client && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | GAME-01 | unit | `cd client && npx vitest run TrueFalseGame` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | INTG-01 | unit | `cd client && npx vitest run TrueFalseGame` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | GAME-03 | unit | `cd client && npx vitest run MemoryMatchGame` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | INTG-01 | unit | `cd client && npx vitest run MemoryMatchGame` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 1 | GAME-02 | unit | `cd client && npx vitest run SortGame` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | INTG-01 | unit | `cd client && npx vitest run SortGame` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 2 | CONT-01 | unit | `cd client && npx vitest run logic` | ❌ W0 | ⬜ pending |
| 09-04-02 | 04 | 2 | CONT-02 | unit | `cd client && npx vitest run logic` | ❌ W0 | ⬜ pending |
| 09-04-03 | 04 | 2 | CONT-03 | unit | `cd client && npx vitest run logic` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/components/games/__tests__/TrueFalseGame.test.jsx` — stubs for GAME-01
- [ ] `client/src/components/games/__tests__/MemoryMatchGame.test.jsx` — stubs for GAME-03
- [ ] `client/src/components/games/__tests__/SortGame.test.jsx` — stubs for GAME-02
- [ ] `client/src/data/__tests__/logic.test.js` — stubs for CONT-01, CONT-02, CONT-03

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS 3D card flip animation | GAME-03 | Visual animation quality cannot be unit tested | Open MemoryMatch game, flip card pairs, verify smooth 3D rotation |
| iOS/Android tap-to-place | GAME-02 | Touch interaction on real devices | Test SortGame on mobile: tap item to select, tap position to place |
| speakWord() audio playback | GAME-01 | Web Speech API requires real browser | Open TrueFalse game, verify claim is spoken on load + replay button works |
| Freemium paywall gating | CONT-02 | Requires parent subscription state | Navigate to Logic module as unpaid family, verify paywall appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
