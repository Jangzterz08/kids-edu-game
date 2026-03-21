# Phase 6: Adaptive Learning - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up the existing `ModuleDifficulty` and `ReviewSchedule` tables (already migrated, zero app code) to record difficulty from score history, and surface two new sections on KidHome: "Recommended" (modules in the kid's medium band) and "Review Today" (lessons due for spaced repetition review). No new pages, no new routes beyond extending `home-summary`. Parent/teacher dashboards are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Difficulty Classification — When to Write

- **Write on every lesson save**: `upsertProgress` in `server/src/services/progressSync.js` is the hook point. After the `LessonProgress` upsert completes (inside the existing `$transaction`), upsert the parent module's `ModuleDifficulty` record for the kid.
- **Update on every save** — not just improvements. Accuracy reflects the kid's current best, which `upsertProgress` already computes as the best-score-per-game-type.

### Difficulty Classification — Age-Adjusted Thresholds

The `ageGroup` field on `KidProfile` (`"3-4"` | `"5-6"` | `"7-8"`, nullable) shifts the easy/medium/hard cutoffs:

| Age Group | easy    | medium   | hard   |
|-----------|---------|----------|--------|
| `3-4`     | ≥ 70%   | 50–69%   | < 50%  |
| `5-6`     | ≥ 75%   | 60–74%   | < 60%  |
| `7-8`     | ≥ 80%   | 65–79%   | < 65%  |
| `null`    | ≥ 75%   | 60–74%   | < 60%  |

**Rationale:** A 3-year-old scoring 55% is performing normally; the same score in a 7-year-old signals a real gap. Null ageGroup falls back to the 5-6 thresholds as the safe middle.

### Difficulty Classification — Accuracy Formula

`accuracy` for a module = **average of per-lesson best scores**, where per-lesson best = highest non-null value across the 8 `SCORE_FIELDS` (`matchScore`, `traceScore`, `quizScore`, `spellingScore`, `phonicsScore`, `patternScore`, `oddOneOutScore`, `scrambleScore`).

- Only completed lessons (at least one non-null score field) contribute to the average.
- If the module has no completed lessons yet, skip the `ModuleDifficulty` upsert.

### Recommendation Logic

- **Source**: modules where the kid's `ModuleDifficulty.level = "medium"` (the age-adjusted in-between band).
- **Cap**: 3 cards maximum.
- **Fallback when fewer than 3 medium modules**: fill remaining slots with modules the kid has not started (no `LessonProgress` rows), filtered to age-appropriate content — simpler modules first (sorted by `Module.sortOrder`).
- **Placement on KidHome**: above the main module grid, below the greeting/header area.
- **Section label**: `"⭐ Recommended for You"` — emoji-forward, ocean theme.
- **Edge case**: if the kid has mastered everything (no medium modules, no untried modules), hide the section entirely.

### Review Today UX

- **Granularity**: lesson-level cards (not module cards). Kids tap directly into the specific lesson to redo. Navigation target: `LessonPlayer` (same as the normal lesson tap flow).
- **Cap**: up to 3 lessons per day.
- **Priority order**: lowest accuracy first; ties broken by oldest `lastReviewedAt` (or `createdAt` if never reviewed).
- **Filter**: only lessons where `ReviewSchedule.dueDate ≤ today`. Lessons not yet in the review queue do not appear here.
- **Placement on KidHome**: between "Recommended" and the main module grid. Layout order top-to-bottom: Recommended → Review Today → Module Grid.
- **Section label**: `"🔁 Review Today"`.
- **Hide when empty**: if no lessons are due, the section does not render (no "nothing to review" empty state — the module grid is the fallback).

### Spaced Repetition — Full SM-2

Use the SM-2 algorithm (same as Anki/Duolingo) for `ReviewSchedule`:

**Fields used**: `interval` (days until next review), `easeFactor` (default 2.5), `reviewCount`, `dueDate`, `lastReviewedAt`.

**Create trigger**: first time a kid scores below the age-adjusted threshold for "medium" on a lesson (i.e., score puts them in "hard" — below the lower medium boundary). Initial values: `interval = 1`, `easeFactor = 2.5`, `dueDate = today + 1 day`.

**Update trigger**: every subsequent attempt on a lesson that has a `ReviewSchedule` row. Apply SM-2:

```
q = score / 100 * 5   // normalise to 0–5 SM-2 quality scale
if q >= 3:
  if reviewCount == 0: interval = 1
  elif reviewCount == 1: interval = 6
  else: interval = round(prev_interval * easeFactor)
  easeFactor = max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
else:
  interval = 1  // reset — not retained
easeFactor unchanged on failure
dueDate = today + interval
reviewCount += 1
lastReviewedAt = now()
```

**If score improves above the "medium" threshold** (kid is no longer "hard"): keep the `ReviewSchedule` row but extend the interval naturally via SM-2 — do not delete the row. The lesson will age out of the "Review Today" queue once `dueDate` moves far enough out.

### Claude's Discretion

- Exact visual design of the Recommended and Review Today section cards (reuse existing `ModuleCard` style or create a slimmer variant)
- Whether to compute recommendations server-side (in `home-summary`) or derive them client-side from the difficulty data returned in the response — server-side is preferred to keep client logic thin
- SM-2 implementation as a pure utility function in `server/src/lib/sm2.js` vs inline in `progressSync.js`
- Whether `ageGroup` is read from `req.kid` (JWT payload, already returned by `resolveKidAccess`) or from a fresh DB query — use JWT payload if present to avoid an extra query

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ADL-01, ADL-02, ADL-03 define all acceptance criteria for this phase
- `.planning/ROADMAP.md` §Phase 6 — Success criteria (3 must-be-true statements) are the verification targets

### Existing code — integration points
- `server/src/services/progressSync.js` — `upsertProgress` function: ModuleDifficulty + ReviewSchedule writes go here, inside the existing `$transaction`
- `server/src/routes/kids.js` `GET /:kidId/home-summary` — `recommendations` and `reviewToday` arrays added to this response
- `server/prisma/schema.prisma` — `ModuleDifficulty` and `ReviewSchedule` model definitions (already migrated)
- `client/src/pages/KidHome.jsx` — new "Recommended" and "Review Today" sections added here
- `client/src/components/kid/AddKidModal.jsx` — confirms ageGroup values: `"3-4"` | `"5-6"` | `"7-8"`

### No external specs
No external algorithm spec exists in this repo. SM-2 algorithm is public domain; the canonical reference is the original SM-2 description (SuperMemo algorithm). Age-adjusted thresholds are defined above in decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `upsertProgress` (`progressSync.js`) — already runs inside `$transaction`; extend to upsert `ModuleDifficulty` and create/update `ReviewSchedule` in the same transaction
- `home-summary` endpoint (`kids.js:103`) — already uses `Promise.all` for parallel queries; add `ModuleDifficulty` and `ReviewSchedule` fetches to the parallel block
- `SCORE_FIELDS` constant (`progressSync.js`) — the 8 game score field names; import/reuse for accuracy calculation
- `KidHome.jsx` module grid — existing `progressData` array has `moduleSlug`, `starsEarned`, `lessonsCompleted`; recommendation logic can join against this

### Established Patterns
- **Prisma transactions**: `prisma.$transaction(async tx => { ... })` — already used in `upsertProgress`
- **Server route pattern**: `try/catch + next(err)`, returns JSON
- **Client data fetching**: direct `api.get` in `useEffect` inside page components — recommendations arrive in `home-summary` response, no additional client fetch needed
- **Inline styles on KidHome**: KidHome uses a large `s` styles object with inline style props — new sections follow the same pattern

### Integration Points
- `upsertProgress` is called from `POST /api/progress/sync` in `server/src/routes/progress.js` — the only write path for lesson scores
- `resolveKidAccess` in `kids.js` returns the kid object including `ageGroup` — available without extra query when computing difficulty thresholds
- `home-summary` already includes `progress[]` per module — `ModuleDifficulty` level can be joined server-side and included in each module object or as a separate `recommendations[]` array

</code_context>

<specifics>
## Specific Ideas

- Age-adjusted thresholds are the key design insight: a 3-year-old scoring 55% is performing normally, the same score in a 7-year-old signals a real gap. The null ageGroup fallback uses 5-6 thresholds.
- "Review Today" shows only what's actually due (dueDate ≤ today) — the kid won't see the same lessons every day once they start improving. SM-2's interval growth handles this automatically.
- Recommended section fills gracefully: medium-band modules first, then age-appropriate untried modules if fewer than 3 found. Never shows empty state — hides entirely if nothing qualifies.
- KidHome layout order (top to bottom): greeting/header → Recommended → Review Today → Module Grid. Logical priority: do something new → fix something known → explore freely.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6 scope.

</deferred>

---

*Phase: 06-adaptive-learning*
*Context gathered: 2026-03-21*
