---
phase: 2
slug: polish-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (server: `server/vitest.config.js`) |
| **Config file** | `server/vitest.config.js` |
| **Quick run command** | `cd server && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd server && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd server && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | POL-01 | manual | — | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | POL-02 | manual | — | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | POL-03 | manual | — | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | POL-04 | manual | — | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | POL-05 | manual | — | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | POL-06 | manual | — | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | POL-07 | unit | `cd server && npx vitest run` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | POL-08 | unit | `cd server && npx vitest run` | ❌ W0 | ⬜ pending |
| 2-03-03 | 03 | 2 | POL-09 | unit | `cd server && npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/components/ToastProvider.test.jsx` — renders Toaster, stubs for POL-01
- [ ] `client/src/components/ErrorBoundary.test.jsx` — stubs for POL-02
- [ ] `client/src/lib/avatars.test.js` — avatar map completeness test for POL-07
- [ ] `server/routes/dailyChallenge.test.js` — route ordering test for POL-09

*Most UI behaviors (toast display, PWA prompt, OG meta) are manual-only by nature.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Toast appears on coin earn | POL-01 | Visual browser test required | Complete a lesson, observe toast |
| Toast appears on streak hit | POL-01 | Requires real user session | Hit daily streak, observe toast |
| Toast appears when offline | POL-01 | Network throttle required | DevTools → Offline, observe banner |
| Error boundary recovery UI | POL-02 | Requires forced React crash | Temporarily throw in a component, reload |
| PWA install prompt (Android) | POL-03 | Requires second visit + browser | Open app twice on Android Chrome |
| PWA install tooltip (iOS) | POL-03 | No programmatic iOS prompt | Open on Safari iOS, observe tooltip |
| OG image in iMessage preview | POL-05 | Requires real device share | Share URL via iMessage, check preview |
| OG image in Slack preview | POL-05 | Requires Slack link unfurl | Paste URL in Slack, check preview |
| Security headers in browser | POL-06 | DevTools network tab | Load app, check response headers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
