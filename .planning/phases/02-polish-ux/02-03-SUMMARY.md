---
phase: 02-polish-ux
plan: 03
subsystem: client-data-consistency
tags: [avatar-unification, star-computation, daily-challenge, client-server-sync]
dependency_graph:
  requires: [02-01]
  provides: [unified-avatar-map, server-authoritative-stars, daily-challenge-api]
  affects: [client/src/lib/avatars.js, client/src/pages/*, client/src/components/*, server/src/routes/dailyChallenge.js]
tech_stack:
  added: []
  patterns:
    - Single source of truth for avatar emoji map (lib/avatars.js)
    - Server-authoritative star computation (removed client duplicate)
    - API-driven daily challenge slug (removed client-side day-of-year formula)
key_files:
  created:
    - client/src/lib/avatars.js
  modified:
    - client/src/pages/KidHome.jsx
    - client/src/pages/ParentDashboard.jsx
    - client/src/pages/Login.jsx
    - client/src/pages/ClassroomDetail.jsx
    - client/src/components/layout/KidLayout.jsx
    - client/src/components/classroom/LeaderboardTable.jsx
    - client/src/components/kid/KidCard.jsx
    - client/src/pages/MiniGame.jsx
    - client/src/data/index.js
    - client/src/pages/ModuleComplete.jsx
    - server/src/routes/dailyChallenge.js
decisions:
  - "Single AVATAR_EMOJIS constant in lib/avatars.js with 16 entries (dino: 🦖) — all 7 consumers import from it"
  - "computeStars removed from MiniGame.jsx — server progressSync.js is sole authority on starsEarned"
  - "/today endpoint added before /:kidId in dailyChallenge.js to avoid Express route shadowing"
  - "ModuleComplete.jsx fetches /api/daily-challenge/today async — stays within auth wall (kid JWT present)"
metrics:
  duration: 4 minutes
  completed: "2026-03-20T18:52:51Z"
  tasks_completed: 2
  files_modified: 11
---

# Phase 02 Plan 03: Avatar Unification, Server-Authoritative Stars, Daily Challenge API Summary

**One-liner:** Unified 16-entry avatar map in lib/avatars.js, removed client computeStars duplicate, added /api/daily-challenge/today endpoint to replace client-side day-of-year formula.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create shared AVATAR_EMOJIS constant, update all 7 consumers | 15f44f7 | avatars.js + 7 consumer files |
| 2 | Remove client computeStars, add /today endpoint, remove getDailyChallengeSlug | 11ee0d1 | MiniGame.jsx, data/index.js, ModuleComplete.jsx, dailyChallenge.js |

## What Was Built

### Task 1: Unified Avatar Map (POL-07)

Created `client/src/lib/avatars.js` as the single source of truth for the avatar emoji map:

```js
export const AVATAR_EMOJIS = {
  bear: '🐻', lion: '🦁', rabbit: '🐰', cat: '🐱',
  dog: '🐶', owl: '🦉', fox: '🦊', penguin: '🐧',
  frog: '🐸', chick: '🐥', hamster: '🐹', panda: '🐼',
  butterfly: '🦋', dragon: '🐉', dino: '🦖', unicorn: '🦄',
};
```

**Bug fixed:** ParentDashboard.jsx had only 8 entries — avatars 9-16 (frog through unicorn) showed fallback bear. Now all 16 avatars display correctly.

**Note:** Login.jsx had `dino: '🦕'` (sauropod) while the canonical set uses `'🦖'` (T-rex). Unified to `'🦖'` matching KidHome.jsx's canonical definition.

All 7 consumer files updated to `import { AVATAR_EMOJIS } from '../lib/avatars'` (or `'../../lib/avatars'` for components).

### Task 2: Server-Authoritative Stars + Daily Challenge API (POL-08, POL-09)

**Part A — computeStars removed (POL-08):**
- Deleted `computeStars()` function from `MiniGame.jsx`
- Removed `starsEarned: computeStars(newScores)` from the update object
- Server's `progressSync.js` already computes `starsEarned` correctly and returns it in the API response
- `useProgress.js` `recordLesson()` already returns the full API result (from Plan 02-01)

**Part B — /today endpoint added (POL-09):**
- Added `router.get('/today', ...)` in `server/src/routes/dailyChallenge.js`
- Placed BEFORE `router.get('/:kidId', ...)` to prevent Express route shadowing
- Returns `{ moduleSlug: getChallengeSlug() }` — reuses existing `getChallengeSlug()` function
- Route is behind `requireAuth` (router is mounted with auth in index.js) — acceptable since ModuleComplete.jsx is within the kid auth wall

**Part C — getDailyChallengeSlug removed (POL-09):**
- Deleted `getDailyChallengeSlug()` and `DAILY_MODULE_SLUGS` from `client/src/data/index.js`
- Updated `ModuleComplete.jsx` to call `api.get('/api/daily-challenge/today')` async instead of synchronous client-side formula
- Promise chain structure preserved: fetch today's slug, then conditionally POST complete if module matches

## Verification

- `grep -rn "computeStars" client/src/` — no matches (PASS)
- `grep -rn "getDailyChallengeSlug" client/src/` — no matches (PASS)
- `/today` route at line 25, `/:kidId` at line 30 in dailyChallenge.js (correct order, PASS)
- `cat client/src/lib/avatars.js | grep -c ":"` — 16 entries (PASS)
- `cd server && npx vitest run` — 21/21 tests pass (PASS)
- `cd client && npm run build` — built in 1.05s, no errors (PASS)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files Exist

- FOUND: client/src/lib/avatars.js
- FOUND: client/src/pages/ParentDashboard.jsx
- FOUND: client/src/pages/ModuleComplete.jsx
- FOUND: server/src/routes/dailyChallenge.js

### Commits Exist

- FOUND: 15f44f7 — feat(02-polish-ux-03): create shared AVATAR_EMOJIS constant, update all 7 consumers
- FOUND: 11ee0d1 — feat(02-polish-ux-03): remove client star computation, add /today endpoint, remove client slug fn

## Self-Check: PASSED
