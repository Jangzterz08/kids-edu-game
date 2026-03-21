---
phase: 7
slug: analytics-observability
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 7-01-01 | 01 (viewport) | 1 | viewport fix | manual | DevTools 375×667 — no scrollbar on `/play/:slug/game` | ✅ manual | ⬜ pending |
| 7-02-01 | 02 (Sentry) | 1 | OBS-01 client | manual smoke | Browser Network tab → `*.ingest.sentry.io` request present | manual | ⬜ pending |
| 7-02-02 | 02 (Sentry) | 1 | OBS-01 server | unit | `cd server && npx vitest run tests/observability/obs01-sentry.test.js` | ❌ Wave 0 | ⬜ pending |
| 7-03-01 | 03 (sessions) | 2 | OBS-02 heartbeat | unit | `cd server && npx vitest run tests/observability/obs02-sessions.test.js` | ❌ Wave 0 | ⬜ pending |
| 7-03-02 | 03 (parent) | 2 | OBS-02 analytics | unit | `cd server && npx vitest run tests/observability/obs02-analytics.test.js` | ❌ Wave 0 | ⬜ pending |
| 7-04-01 | 04 (teacher) | 2 | OBS-03 | unit | `cd server && npx vitest run tests/observability/obs03-analytics.test.js` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/observability/obs01-sentry.test.js` — stubs for OBS-01 server init + capture
- [ ] `server/tests/observability/obs02-sessions.test.js` — stubs for heartbeat endpoint (create, update, auth)
- [ ] `server/tests/observability/obs02-analytics.test.js` — stubs for parent analytics endpoint (data shape, auth, period filter)
- [ ] `server/tests/observability/obs03-analytics.test.js` — stubs for teacher analytics endpoint (matrix shape, auth, classroom ownership)

*Test pattern follows established project pattern (see `server/tests/security/sec01-price-validation.test.js`): set env vars → import app → use supertest → vi.spyOn(global.prisma) for DB calls.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sentry client SDK sends events to ingest | OBS-01 | Browser SDK can't be unit-tested without real DSN | Open DevTools Network → throw JS error → check for request to `*.ingest.sentry.io` |
| Game fits viewport without scroll | viewport fix | CSS layout requires visual inspection | DevTools → Responsive → 375×667 → navigate to any `/play/:slug/game` → confirm no vertical scrollbar |
| Parent analytics chart renders | OBS-02 | Recharts rendering requires browser | Log in as parent → go to `/parent/analytics` → confirm chart shows bars for each day |
| Teacher struggling indicator | OBS-03 | Color + ⚠ icon requires visual check | Log in as teacher → go to classroom analytics → confirm red cells for students with avgStars < 1.5 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
