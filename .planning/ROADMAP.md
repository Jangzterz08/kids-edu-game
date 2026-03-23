# Roadmap: KidsLearn

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-03-21)
- 🚧 **v1.1 Logic & Reasoning** — Phases 8–9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–7) — SHIPPED 2026-03-21</summary>

- [x] Phase 1: Security Hardening (2/2 plans) — completed 2026-03-19
- [x] Phase 2: Polish & UX (3/3 plans) — completed 2026-03-20
- [x] Phase 3: Performance (2/2 plans) — completed 2026-03-20
- [x] Phase 4: Parent Subscriptions (4/4 plans) — completed 2026-03-21
- [x] Phase 5: School Licensing (4/4 plans) — completed 2026-03-21
- [x] Phase 6: Adaptive Learning (2/2 plans) — completed 2026-03-21
- [x] Phase 7: Analytics & Observability (5/5 plans) — completed 2026-03-21

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Logic & Reasoning (In Progress)

**Milestone Goal:** Add a Logic & Reasoning content module with 3 new game types (sort, trueFalse, memoryMatch) and age-adaptive difficulty for ages 4–8, fully wired into the existing scoring, coins, streak, and spaced-repetition systems.

- [ ] **Phase 8: Infrastructure** — DB migration, server wiring, and routing plumbing for 3 new game types
- [ ] **Phase 9: Game Components & Content** — Logic module lesson data, TrueFalseGame, MemoryMatchGame, SortGame, and age filtering

## Phase Details

### Phase 8: Infrastructure
**Goal**: The server and routing layer are fully wired for 3 new game types — scores persist, stars compute correctly, and analytics reflect new game data — before any game component is written
**Depends on**: Phase 7
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. A lesson progress POST with `sortScore`, `trueFalseScore`, or `memoryMatchScore` fields persists non-null values to the database
  2. Stars and SM-2 scheduling compute correctly for lessons using the 3 new score fields (SCORE_FIELDS array includes all 3)
  3. The `/api/progress/:kidId/stats` endpoint returns `sortScore`, `trueFalseScore`, and `memoryMatchScore` keys in `gameAccuracy`
  4. `MiniGame.jsx` dispatches to all 3 new gameType strings without falling through to the default 1-star branch
**Plans:** 1/2 plans executed

Plans:
- [ ] 08-01-PLAN.md — Prisma migration + SCORE_FIELDS wiring (INFRA-01, INFRA-02)
- [ ] 08-02-PLAN.md — MiniGame routing + stats endpoint (INFRA-03, INFRA-04)

### Phase 9: Game Components & Content
**Goal**: Kids can play Logic & Reasoning lessons using all 3 new game types, with age-appropriate content shown automatically and scores flowing through coins, streak, and SM-2 without changes to those systems
**Depends on**: Phase 8
**Requirements**: CONT-01, CONT-02, CONT-03, GAME-01, GAME-02, GAME-03, INTG-01
**Success Criteria** (what must be TRUE):
  1. A kid aged 4–6 navigating to the Logic & Reasoning module sees lessons appropriate for their age group (simpler items, no text)
  2. A kid completes a TrueFalse lesson: the claim is auto-spoken on load, tapping True or False shows visual feedback, coins and stars update correctly on the results screen
  3. A kid completes a MemoryMatch lesson: card pairs flip with CSS 3D animation, matched pairs lock, mismatched pairs flip back after 900ms, and a completion score reaches the progress API
  4. A kid completes a Sort lesson on a mobile device (iOS/Android): items can be selected and placed using tap interaction (no drag required), and the correct-order percentage score persists
  5. The Logic & Reasoning module appears in the module list gated behind premium (not in the free 3 modules), and the freemium paywall shows correctly for unpaid families
**Plans:** 1/4 plans executed

Plans:
- [ ] 09-01-PLAN.md — TrueFalseGame component (GAME-01, INTG-01)
- [ ] 09-02-PLAN.md — MemoryMatchGame component (GAME-03, INTG-01)
- [ ] 09-03-PLAN.md — SortGame component (GAME-02, INTG-01)
- [ ] 09-04-PLAN.md — Logic module content + registry + age filtering + wiring (CONT-01, CONT-02, CONT-03)

## Progress

**Execution Order:** 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security Hardening | v1.0 | 2/2 | Complete | 2026-03-19 |
| 2. Polish & UX | v1.0 | 3/3 | Complete | 2026-03-20 |
| 3. Performance | v1.0 | 2/2 | Complete | 2026-03-20 |
| 4. Parent Subscriptions | v1.0 | 4/4 | Complete | 2026-03-21 |
| 5. School Licensing | v1.0 | 4/4 | Complete | 2026-03-21 |
| 6. Adaptive Learning | v1.0 | 2/2 | Complete | 2026-03-21 |
| 7. Analytics & Observability | v1.0 | 5/5 | Complete | 2026-03-21 |
| 8. Infrastructure | 1/2 | In Progress|  | - |
| 9. Game Components & Content | 1/4 | In Progress|  | - |
