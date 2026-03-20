---
phase: 03-performance
plan: 01
subsystem: api-aggregation
tags: [performance, api, react, server]
dependency_graph:
  requires: []
  provides: [home-summary-endpoint, daily-challenge-utils]
  affects: [client/KidHome, server/kids-route, server/daily-challenge-route]
tech_stack:
  added: []
  patterns: [promise-all-parallel-queries, shared-utility-extraction, single-api-call-aggregation]
key_files:
  created:
    - server/src/lib/dailyChallengeUtils.js
    - server/tests/performance/perf01-home-summary.test.js
  modified:
    - server/src/routes/dailyChallenge.js
    - server/src/routes/kids.js
    - client/src/pages/KidHome.jsx
decisions:
  - "Shared dailyChallengeUtils.js CJS module avoids duplicating DAILY_SLUGS array and pure functions across route files"
  - "resolveKidAccess pattern copied from progress.js supports kid JWT, parent ownership, and teacher enrollment checks"
  - "home-summary placed before PUT /:kidId to avoid Express route shadowing concerns"
  - "refreshKids() removed from KidHome useEffect — kid stats now served by home-summary endpoint directly"
metrics:
  duration_seconds: 165
  completed_date: "2026-03-20T19:35:34Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
---

# Phase 03 Plan 01: KidHome Home-Summary API Aggregation Summary

**One-liner:** Single `GET /api/kids/:kidId/home-summary` endpoint collapses KidHome's 5 parallel network requests into 1, using `Promise.all` for parallel DB queries and a shared `dailyChallengeUtils.js` utility.

## What Was Built

### server/src/lib/dailyChallengeUtils.js (new)
Extracted `DAILY_SLUGS`, `todayDate()`, and `getChallengeSlug()` from `dailyChallenge.js` into a shared CJS module. Both `dailyChallenge.js` and `kids.js` now import from this single source of truth — no duplication.

### GET /api/kids/:kidId/home-summary (new route in kids.js)
Returns all data KidHome needs in a single JSON response:
```json
{
  "kid":          { "id", "name", "avatarId", "totalStars", "currentStreak", "coins" },
  "progress":     [ { "moduleSlug", "lessonsTotal", "lessonsCompleted", "starsEarned", "maxStars" } ],
  "achievements": [ ... ],
  "classrooms":   [ ... ],
  "dailyChallenge": { "moduleSlug", "completedAt", "coinsEarned" }
}
```
Uses `Promise.all` to run all 4 DB queries in parallel. Access control via `resolveKidAccess` (kid JWT, parent, teacher).

### client/src/pages/KidHome.jsx (updated)
Replaced 5 separate `api.get()` calls in `useEffect` with a single `api.get(/api/kids/:kidId/home-summary)` call. Removed `refreshKids` from the component entirely — kid stats now served directly from the aggregated endpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create shared utility and home-summary endpoint | cb6b99e | dailyChallengeUtils.js, dailyChallenge.js, kids.js, perf01-home-summary.test.js |
| 2 | Update KidHome.jsx to single API call | 284ee05 | KidHome.jsx |

## Verification

- `npx vitest run tests/performance/perf01-home-summary.test.js` — 2/2 tests pass
- `npx vite build` — builds cleanly
- Pre-existing sec06-body-destructure test failures confirmed unrelated to this plan (fail without these changes too)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- server/src/lib/dailyChallengeUtils.js: FOUND
- server/tests/performance/perf01-home-summary.test.js: FOUND
- server/src/routes/kids.js contains home-summary route: FOUND
- client/src/pages/KidHome.jsx contains single home-summary call: FOUND

Commits exist:
- cb6b99e: FOUND
- 284ee05: FOUND
