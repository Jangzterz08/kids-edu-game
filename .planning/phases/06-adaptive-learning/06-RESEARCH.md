# Phase 06: Adaptive Learning - Research

**Researched:** 2026-03-21
**Domain:** Spaced repetition (SM-2), server-side difficulty classification, React home screen composition
**Confidence:** HIGH — all findings derived from direct codebase inspection and locked CONTEXT.md decisions

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Difficulty Classification — When to Write**
- Write on every lesson save: `upsertProgress` in `server/src/services/progressSync.js` is the hook point. After the `LessonProgress` upsert completes (inside the existing `$transaction`), upsert the parent module's `ModuleDifficulty` record for the kid.
- Update on every save — not just improvements. Accuracy reflects the kid's current best, which `upsertProgress` already computes as the best-score-per-game-type.

**Difficulty Classification — Age-Adjusted Thresholds**

| Age Group | easy    | medium   | hard   |
|-----------|---------|----------|--------|
| `3-4`     | >= 70%  | 50–69%   | < 50%  |
| `5-6`     | >= 75%  | 60–74%   | < 60%  |
| `7-8`     | >= 80%  | 65–79%   | < 65%  |
| `null`    | >= 75%  | 60–74%   | < 60%  |

Null ageGroup falls back to the 5-6 thresholds.

**Difficulty Classification — Accuracy Formula**
- `accuracy` for a module = average of per-lesson best scores, where per-lesson best = highest non-null value across the 8 `SCORE_FIELDS`.
- Only completed lessons (at least one non-null score field) contribute to the average.
- If the module has no completed lessons yet, skip the `ModuleDifficulty` upsert.

**Recommendation Logic**
- Source: modules where `ModuleDifficulty.level = "medium"`.
- Cap: 3 cards maximum.
- Fallback when fewer than 3 medium modules: fill with modules the kid has not started (no `LessonProgress` rows), sorted by `Module.sortOrder`.
- Placement on KidHome: above the main module grid, below the greeting/header area.
- Section label: "⭐ Recommended for You".
- Edge case: if no medium and no untried modules, hide the section entirely.

**Review Today UX**
- Granularity: lesson-level cards. Navigation target: LessonPlayer (same as normal lesson tap flow).
- Cap: up to 3 lessons per day.
- Priority order: lowest accuracy first; ties broken by oldest `lastReviewedAt` (or `createdAt` if never reviewed).
- Filter: only lessons where `ReviewSchedule.dueDate <= today`.
- Placement: between "Recommended" and the main module grid.
- Section label: "🔁 Review Today".
- Hide when empty: no empty state shown.

**Spaced Repetition — Full SM-2 Algorithm**
- Fields: `interval` (days), `easeFactor` (default 2.5), `reviewCount`, `dueDate`, `lastReviewedAt`.
- Create trigger: first time a kid scores below the age-adjusted "medium" lower boundary (i.e., score puts them in "hard"). Initial values: `interval = 1`, `easeFactor = 2.5`, `dueDate = today + 1 day`.
- Update trigger: every subsequent attempt on a lesson that already has a `ReviewSchedule` row.
- SM-2 formula (exact):
  ```
  q = score / 100 * 5   // normalise to 0–5
  if q >= 3:
    if reviewCount == 0: interval = 1
    elif reviewCount == 1: interval = 6
    else: interval = round(prev_interval * easeFactor)
    easeFactor = max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  else:
    interval = 1  // reset — not retained
    // easeFactor unchanged on failure
  dueDate = today + interval
  reviewCount += 1
  lastReviewedAt = now()
  ```
- If score improves above the "medium" threshold: keep the row but let SM-2 extend the interval naturally. Do not delete.

### Claude's Discretion
- Exact visual design of the Recommended and Review Today section cards (reuse existing `ModuleCard` style or create a slimmer variant).
- Whether to compute recommendations server-side (in `home-summary`) or client-side — server-side is preferred to keep client logic thin.
- SM-2 implementation as a pure utility function in `server/src/lib/sm2.js` vs inline in `progressSync.js`.
- Whether `ageGroup` is read from `req.kid` (JWT payload) or from a fresh DB query — use JWT payload if present to avoid an extra query.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 6 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADL-01 | `ModuleDifficulty` and `ReviewSchedule` tables (already migrated) wired to record difficulty level per kid per module based on score history | SM-2 utility function + transaction extension in `upsertProgress`; `ModuleDifficulty` upsert logic documented below |
| ADL-02 | KidHome displays smart module recommendations derived from difficulty data (surface modules where kid scored 60–80%, not already mastered) | `home-summary` server-side extension pattern; `recommendations[]` array shape documented below |
| ADL-03 | Review scheduler surfaces lessons below 60% score in a "Review Today" section on KidHome | `ReviewSchedule` query with `dueDate <= today`; `reviewToday[]` array shape; KidHome insertion point documented below |
</phase_requirements>

---

## Summary

Phase 6 wires up two already-migrated Prisma models (`ModuleDifficulty`, `ReviewSchedule`) to the existing lesson-save flow and surfaces the results on KidHome. The entire backend change is concentrated in two files: `progressSync.js` (adding difficulty + review writes inside the existing `$transaction`) and `kids.js` `home-summary` route (adding `recommendations[]` and `reviewToday[]` to the response). The entire frontend change is concentrated in `KidHome.jsx` (two new sections inserted between `mainHeader` and `moduleGrid`).

The SM-2 algorithm is a well-defined, parameterless formula with no external dependencies. The score normalization decision (score/100 * 5) and the age-adjusted threshold table are both fully locked in CONTEXT.md, so implementation is mechanical. The main implementation risk is the `$transaction` mock boundary in tests: the transaction callback must receive mocks for `moduleDifficulty.upsert` and `reviewSchedule.upsert` / `reviewSchedule.findUnique` in addition to the existing `lessonProgress` and `kidProfile` mocks.

**Primary recommendation:** Extract SM-2 into `server/src/lib/sm2.js` as a pure function (no Prisma dependency), extend the `$transaction` callback to call `tx.moduleDifficulty.upsert` and `tx.reviewSchedule.upsert`/`findUnique`, then add `moduleDifficulty.findMany` and `reviewSchedule.findMany` to the `Promise.all` in `home-summary`.

---

## Standard Stack

### Core (no new dependencies needed)

| Library | Version | Purpose | Already in use |
|---------|---------|---------|----------------|
| Prisma Client | ^7.4.2 | `ModuleDifficulty.upsert`, `ReviewSchedule.upsert` | Yes |
| Express | ^5.2.1 | Route extension (`home-summary`) | Yes |
| Vitest | ^3.2.4 | Tests for ADL-01/02/03 | Yes |

No new npm packages required. SM-2 is pure math; no third-party spaced-repetition library is needed or appropriate (they impose their own data models).

**Installation:** none required.

---

## Architecture Patterns

### Recommended File Structure Changes

```
server/src/
├── lib/
│   ├── sm2.js               NEW — pure SM-2 utility (no Prisma)
│   ├── db.js                unchanged
│   ├── schoolUtils.js       unchanged
│   └── subscriptionUtils.js unchanged
├── services/
│   └── progressSync.js      EXTEND — ModuleDifficulty + ReviewSchedule writes inside $transaction
└── routes/
    └── kids.js              EXTEND — recommendations[] + reviewToday[] in home-summary

client/src/pages/
└── KidHome.jsx              EXTEND — two new sections in main content area

server/tests/
└── adaptive/                NEW directory
    ├── adl01-difficulty-write.test.js
    ├── adl02-recommendations.test.js
    └── adl03-review-today.test.js
```

### Pattern 1: SM-2 as Pure Utility Function

**What:** A single exported function `applySM2(current, scorePercent)` takes the current `ReviewSchedule` record fields and the score (0–100), returns new field values.

**When to use:** Called inside the `$transaction` callback in `progressSync.js`, after the `LessonProgress` upsert.

**Example:**
```javascript
// server/src/lib/sm2.js
// Source: CONTEXT.md locked SM-2 formula

function applySM2({ interval, easeFactor, reviewCount }, scorePercent) {
  const q = (scorePercent / 100) * 5;
  let newInterval;
  let newEaseFactor = easeFactor;

  if (q >= 3) {
    if (reviewCount === 0) newInterval = 1;
    else if (reviewCount === 1) newInterval = 6;
    else newInterval = Math.round(interval * easeFactor);
    newEaseFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    newInterval = 1; // reset — not retained
    // easeFactor unchanged on failure
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    reviewCount: reviewCount + 1,
    dueDate,
    lastReviewedAt: new Date(),
  };
}

module.exports = { applySM2 };
```

### Pattern 2: Age-Adjusted Threshold Utility

**What:** A pure function `classifyAccuracy(accuracy, ageGroup)` returns `"easy" | "medium" | "hard"` and `getHardThreshold(ageGroup)` returns the numeric lower boundary below which a lesson is "hard" (= triggers ReviewSchedule creation).

**Example:**
```javascript
// Inline in progressSync.js or extracted to sm2.js

const THRESHOLDS = {
  '3-4': { easy: 70, medLow: 50 },
  '5-6': { easy: 75, medLow: 60 },
  '7-8': { easy: 80, medLow: 65 },
  null:  { easy: 75, medLow: 60 },
};

function classifyAccuracy(accuracy, ageGroup) {
  const t = THRESHOLDS[ageGroup] || THRESHOLDS[null];
  if (accuracy * 100 >= t.easy) return 'easy';
  if (accuracy * 100 >= t.medLow) return 'medium';
  return 'hard';
}

function getHardThreshold(ageGroup) {
  return (THRESHOLDS[ageGroup] || THRESHOLDS[null]).medLow;
}
```

Note: `accuracy` stored in `ModuleDifficulty` is a Float (0–1 or 0–100 — confirm from schema). Schema shows `accuracy Float @default(0)` — must confirm units. Given the formula "average of per-lesson best scores" where each score field is 0–100, `accuracy` should be stored as 0–100 (a percentage float). The threshold comparison therefore uses raw accuracy against integer cutoffs.

### Pattern 3: Extending the `$transaction` Callback

**What:** Add `ModuleDifficulty` and `ReviewSchedule` operations inside the existing transaction in `progressSync.js` after the `lessonProgress.upsert` completes.

**Key constraint from STATE.md:** The `$transaction` mock in tests must be extended to include `tx.moduleDifficulty` and `tx.reviewSchedule` — failure to do so causes `Cannot read properties of undefined` inside the callback.

**Execution order inside the transaction:**
1. `tx.lessonProgress.findUnique` (existing)
2. `tx.lessonProgress.upsert` (existing)
3. `tx.kidProfile.update` (existing, conditional)
4. `tx.moduleDifficulty.upsert` (NEW) — compute module accuracy, classify, upsert
5. `tx.reviewSchedule.findUnique` (NEW) — check if row exists for this kid+lesson
6. `tx.reviewSchedule.create` or `tx.reviewSchedule.update` (NEW, conditional)

**Important:** `upsertProgress` currently receives `lessonId` (UUID) but needs the `module.slug` (or `moduleId`) to upsert `ModuleDifficulty`. The progress route fetches `lesson` with `include: { module: true }` (lines 200-204 of `progress.js`), but `upsertProgress` only receives `{ lessonId, viewed, attempts, completedAt, ...scores }`. Options:
- Pass `moduleSlug` as an extra field in the entry object to `upsertProgress`.
- Or do a `tx.lesson.findUnique({ where: { id: lessonId }, include: { module: true } })` inside the transaction. This adds a DB round-trip inside the transaction — acceptable but adds latency.
- Preferred: pass `moduleSlug` (or `moduleId`) from the route into the entry object — zero extra queries.

**ageGroup requirement:** `upsertProgress(kidId, entry)` needs the kid's `ageGroup` to compute thresholds. The kid object returned by `resolveWriteAccess` in `progress.js` has `ageGroup` available. Pass it via `entry.ageGroup` or as a third parameter `upsertProgress(kidId, entry, kidAgeGroup)`.

### Pattern 4: home-summary Response Extension

**What:** Add two new parallel queries to the `Promise.all` in `kids.js` `home-summary`, then compute `recommendations[]` and `reviewToday[]` server-side before responding.

**New queries to add to Promise.all:**
```javascript
// Existing: [modules, achievements, enrollments, dailyChallenge, parentUser]
// New:
prisma.moduleDifficulty.findMany({
  where: { kidId: kid.id },
}),
prisma.reviewSchedule.findMany({
  where: { kidId: kid.id, dueDate: { lte: new Date() } },
  include: { lesson: { include: { module: true } } },
  orderBy: [
    { lesson: { /* no direct accuracy sort — sort after fetch */ } },
  ],
}),
```

**Server-side computation of recommendations[]:**
```javascript
// Medium-band modules (up to 3)
const mediumSlugs = difficultyRows
  .filter(d => d.level === 'medium')
  .map(d => d.moduleSlug);

let recommendations = modules
  .filter(m => mediumSlugs.includes(m.slug))
  .slice(0, 3)
  .map(m => ({ moduleSlug: m.slug, title: m.title, iconEmoji: m.iconEmoji }));

// Fill remaining slots with untried modules
if (recommendations.length < 3) {
  const startedSlugs = new Set(
    modules
      .filter(m => m.lessons.some(l => l.progress.length > 0))
      .map(m => m.slug)
  );
  const untried = modules
    .filter(m => !startedSlugs.has(m.slug) && !mediumSlugs.includes(m.slug))
    .slice(0, 3 - recommendations.length)
    .map(m => ({ moduleSlug: m.slug, title: m.title, iconEmoji: m.iconEmoji }));
  recommendations = [...recommendations, ...untried];
}
```

**Server-side computation of reviewToday[]:**

The `ReviewSchedule` model does NOT store `accuracy` — that's on `ModuleDifficulty`. To sort by lowest accuracy, either:
1. Join against `ModuleDifficulty` (requires a second query or include), or
2. Compute a lesson-level score from the `LessonProgress` record fields.

The lesson-level score is available via `ReviewSchedule` -> `lesson` -> `progress` (if included). However, `ReviewSchedule` does not directly relate to `LessonProgress`. The most pragmatic approach: sort by `lastReviewedAt` ASC (oldest first) as the primary sort, since accuracy is implicitly captured by when the lesson was last reviewed. But CONTEXT.md says "lowest accuracy first; ties broken by oldest lastReviewedAt."

To sort by accuracy requires fetching `LessonProgress` records for the due lessons. Options:
- Include `lesson.progress` in the `reviewSchedule.findMany` query (nested include via `lesson -> progress` filtered by `kidId`) — requires `{ lesson: { include: { progress: { where: { kidId: kid.id } } } } }`.
- This is one extra nested include but avoids a separate query. Prisma supports nested includes.

**Recommended reviewToday query:**
```javascript
prisma.reviewSchedule.findMany({
  where: { kidId: kid.id, dueDate: { lte: new Date() } },
  include: {
    lesson: {
      include: {
        module: { select: { slug: true, title: true, iconEmoji: true } },
        progress: { where: { kidId: kid.id }, take: 1 },
      },
    },
  },
})
```

Then sort in JS:
```javascript
const reviewToday = dueSchedules
  .map(rs => {
    const prog = rs.lesson.progress[0];
    const scores = SCORE_FIELDS.map(f => prog?.[f]).filter(s => s != null);
    const accuracy = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      lessonId: rs.lessonId,
      lessonSlug: rs.lesson.slug,
      lessonTitle: rs.lesson.title,
      moduleSlug: rs.lesson.module.slug,
      moduleTitle: rs.lesson.module.title,
      moduleIconEmoji: rs.lesson.module.iconEmoji,
      accuracy,
      lastReviewedAt: rs.lastReviewedAt,
      dueDate: rs.dueDate,
    };
  })
  .sort((a, b) => {
    if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy; // lowest first
    const aDate = a.lastReviewedAt || new Date(0);
    const bDate = b.lastReviewedAt || new Date(0);
    return aDate - bDate; // oldest first
  })
  .slice(0, 3);
```

### Pattern 5: KidHome Component Structure

**What:** Insert two conditional sections inside `<main>` between `mainHeader` div and `moduleGrid` div (lines 139–145 in current KidHome.jsx).

**Current main content structure:**
```jsx
<main style={s.main}>
  <div style={s.mainHeader}>...</div>     // line 138
  <div style={s.moduleGrid}>...</div>     // line 145
</main>
```

**New structure:**
```jsx
<main style={s.main}>
  <div style={s.mainHeader}>...</div>

  {/* Recommended for You */}
  {recommendations.length > 0 && (
    <div style={s.adlSection}>
      <div style={s.adlSectionTitle}>⭐ Recommended for You</div>
      <div style={s.adlCards}>
        {recommendations.map(rec => ( ... ))}
      </div>
    </div>
  )}

  {/* Review Today */}
  {reviewToday.length > 0 && (
    <div style={s.adlSection}>
      <div style={s.adlSectionTitle}>🔁 Review Today</div>
      <div style={s.adlCards}>
        {reviewToday.map(item => ( ... ))}
      </div>
    </div>
  )}

  <div style={s.moduleGrid}>...</div>
</main>
```

**New state variables needed:**
```jsx
const [recommendations, setRecommendations] = useState([]);
const [reviewToday, setReviewToday]         = useState([]);
```

**Added to the existing `api.get` `.then` handler:**
```jsx
setRecommendations(data.recommendations || []);
setRecommendations(data.reviewToday || []);
```

**Card navigation:** Recommended cards navigate to `/play/${rec.moduleSlug}` (same as module grid click). Review Today cards navigate to the lesson player. Current lesson player route is `/play/${moduleSlug}` with lesson selection — confirm actual route with `client/src/App.jsx` or `LessonPlayer` component before implementing. If lesson selection is passed via state or query param, the Review Today card must pass the lesson slug.

### Anti-Patterns to Avoid

- **Deleting ReviewSchedule rows when a kid improves:** The locked decision is to keep rows and let SM-2 extend the interval. Deletion would lose review history.
- **Computing recommendations client-side from difficulty data:** CONTEXT.md marks server-side computation as preferred. Avoids sending all `ModuleDifficulty` rows to the client.
- **Adding `ModuleDifficulty` / `ReviewSchedule` writes outside the `$transaction`:** Both writes depend on the `LessonProgress` data computed inside the transaction. Must remain inside to stay consistent with the "single atomic save" established in Phase 3.
- **Re-querying ageGroup from DB inside `progressSync.js`:** Use the ageGroup passed from the route (available on the kid object from `resolveWriteAccess`) to avoid an extra DB round-trip on every lesson save.
- **Calling `upsertProgress` without passing moduleSlug/ageGroup:** The current signature `upsertProgress(kidId, entry)` must be extended. Existing callers (bulk sync in `progress.js`) must also be updated.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SM-2 interval scheduling | Custom interval formula | Pure `applySM2()` from `sm2.js` (new file) | SM-2 is a well-defined algorithm with an exact formula in CONTEXT.md — implement it once, test it in isolation |
| "Is lesson due today?" | Date arithmetic inline in route | Prisma `dueDate: { lte: new Date() }` filter | Database-side filter avoids loading all rows |
| Accuracy sorting in DB | Complex Prisma ORDER BY across relations | JS `.sort()` after fetch | ReviewSchedule doesn't expose accuracy directly; post-fetch sort on a small dataset (capped at 3) is correct |

---

## Common Pitfalls

### Pitfall 1: `$transaction` mock missing new models
**What goes wrong:** Tests that mock `prisma.$transaction` with a `txMock` object will throw `TypeError: Cannot read properties of undefined (reading 'upsert')` when the transaction callback tries to call `tx.moduleDifficulty.upsert`.
**Why it happens:** The existing `perf02-transaction.test.js` mock only includes `{ lessonProgress, kidProfile }`. The new code adds `tx.moduleDifficulty.upsert` and `tx.reviewSchedule.findUnique` / `tx.reviewSchedule.upsert` / `tx.reviewSchedule.create`.
**How to avoid:** Update `txMock` in `perf02-transaction.test.js` to include `moduleDifficulty: { upsert: vi.fn() }` and `reviewSchedule: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn() }`. New ADL tests must also construct complete `txMock` objects.
**Warning signs:** Test output showing `TypeError: Cannot read properties of undefined`.

### Pitfall 2: upsertProgress signature change breaking bulk sync
**What goes wrong:** `POST /api/progress/:kidId/sync` calls `upsertProgress(kid.id, entry)` in a loop. If the signature is extended to require `ageGroup`, bulk sync will pass `undefined` for ageGroup.
**Why it happens:** The sync route fetches the kid object for write access but doesn't pass `ageGroup` to `upsertProgress`.
**How to avoid:** Either default `ageGroup` to `null` (which uses 5-6 thresholds) when not passed, or pass `kid.ageGroup` in both call sites.

### Pitfall 3: home-summary response breaking perf01 test
**What goes wrong:** `perf01-home-summary.test.js` asserts `expect(res.body).toHaveProperty(...)` for specific keys. Adding `recommendations` and `reviewToday` won't break these assertions (they test presence, not absence), but the test will fail with `TypeError` if the new queries (`moduleDifficulty.findMany`, `reviewSchedule.findMany`) are not mocked.
**Why it happens:** `vi.spyOn` in the test's `beforeEach` doesn't cover the new Prisma model calls.
**How to avoid:** Add `vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([])` and `vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([])` to the `perf01` test's `beforeEach`.

### Pitfall 4: ReviewSchedule accuracy sort requiring LessonProgress include
**What goes wrong:** Sorting `reviewToday` by lowest accuracy requires knowing the lesson's current score. If this is computed without the `lesson.progress` include, `prog` will be `undefined` and accuracy will default to 0 for all items, making the sort arbitrary.
**Why it happens:** `ReviewSchedule` model has no direct accuracy field — accuracy is derived from `LessonProgress`.
**How to avoid:** Use the nested include shown above: `lesson.progress` filtered by `kidId`. This is slightly more complex but avoids a separate query.

### Pitfall 5: `accuracy` field units in ModuleDifficulty
**What goes wrong:** Schema shows `accuracy Float @default(0)`. If stored as 0.0–1.0, threshold comparisons against integer cutoffs (50, 60, 70, etc.) always classify everything as "hard".
**Why it happens:** The schema doesn't document units; the CONTEXT.md formula says "average of per-lesson best scores" where scores are 0–100.
**How to avoid:** Store as 0–100 (raw percentage, matching score field values). Document this clearly in a code comment inside `progressSync.js`.

---

## Code Examples

### SM-2 Utility (full implementation)

```javascript
// server/src/lib/sm2.js
// Source: CONTEXT.md locked SM-2 formula

const THRESHOLDS = {
  '3-4': { easy: 70, medLow: 50 },
  '5-6': { easy: 75, medLow: 60 },
  '7-8': { easy: 80, medLow: 65 },
};
const DEFAULT_THRESHOLDS = { easy: 75, medLow: 60 }; // null / unrecognised

function getThresholds(ageGroup) {
  return THRESHOLDS[ageGroup] || DEFAULT_THRESHOLDS;
}

function classifyAccuracy(accuracyPct, ageGroup) {
  const t = getThresholds(ageGroup);
  if (accuracyPct >= t.easy) return 'easy';
  if (accuracyPct >= t.medLow) return 'medium';
  return 'hard';
}

function getHardThreshold(ageGroup) {
  return getThresholds(ageGroup).medLow;
}

/**
 * Apply SM-2 to an existing ReviewSchedule record.
 * @param {{ interval: number, easeFactor: number, reviewCount: number }} current
 * @param {number} scorePercent  0–100
 * @returns {{ interval, easeFactor, reviewCount, dueDate, lastReviewedAt }}
 */
function applySM2({ interval, easeFactor, reviewCount }, scorePercent) {
  const q = (scorePercent / 100) * 5;
  let newInterval;
  let newEaseFactor = easeFactor;

  if (q >= 3) {
    if (reviewCount === 0) newInterval = 1;
    else if (reviewCount === 1) newInterval = 6;
    else newInterval = Math.round(interval * easeFactor);
    newEaseFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    );
  } else {
    newInterval = 1;
    // easeFactor unchanged on failure per SM-2 spec
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    reviewCount: reviewCount + 1,
    dueDate,
    lastReviewedAt: new Date(),
  };
}

module.exports = { classifyAccuracy, getHardThreshold, applySM2, getThresholds };
```

### Module Accuracy Computation (inside transaction)

```javascript
// Inside progressSync.js $transaction callback, after lessonProgress.upsert
// Source: CONTEXT.md accuracy formula

// Fetch all lesson progress for this module to compute module accuracy
const moduleProgress = await tx.lessonProgress.findMany({
  where: { kidId, lesson: { moduleId: moduleId } },
  select: { matchScore: true, traceScore: true, quizScore: true,
            spellingScore: true, phonicsScore: true, patternScore: true,
            oddOneOutScore: true, scrambleScore: true },
});

// Per-lesson best = max of non-null scores; module accuracy = average of per-lesson bests
const lessonBests = moduleProgress
  .map(lp => {
    const scores = SCORE_FIELDS.map(f => lp[f]).filter(s => s !== null && s !== undefined);
    return scores.length ? Math.max(...scores) : null;
  })
  .filter(v => v !== null);

if (lessonBests.length > 0) {
  const accuracyPct = lessonBests.reduce((a, b) => a + b, 0) / lessonBests.length;
  const level = classifyAccuracy(accuracyPct, ageGroup);
  await tx.moduleDifficulty.upsert({
    where: { kidId_moduleSlug: { kidId, moduleSlug } },
    create: { kidId, moduleSlug, level, accuracy: accuracyPct },
    update: { level, accuracy: accuracyPct },
  });
}
```

Note: this requires knowing `moduleId` and `moduleSlug` inside `upsertProgress`. Pass `moduleSlug` via `entry.moduleSlug` from the route.

### ReviewSchedule Create/Update (inside transaction)

```javascript
// Source: CONTEXT.md SM-2 trigger rules

const lessonScorePct = /* best score from current entry across SCORE_FIELDS */;
const hardThreshold = getHardThreshold(ageGroup);

const existingReview = await tx.reviewSchedule.findUnique({
  where: { kidId_lessonId: { kidId, lessonId } },
});

if (!existingReview) {
  // Create trigger: first time score is in "hard" zone
  if (lessonScorePct < hardThreshold) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    await tx.reviewSchedule.create({
      data: {
        kidId,
        lessonId,
        dueDate,
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 0,
        lastReviewedAt: null,
      },
    });
  }
} else {
  // Update trigger: apply SM-2
  const sm2Result = applySM2(existingReview, lessonScorePct);
  await tx.reviewSchedule.update({
    where: { kidId_lessonId: { kidId, lessonId } },
    data: sm2Result,
  });
}
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|---|---|---|
| `recommended` in `/api/progress/:kidId/stats` (single slot, completion-based) | `recommendations[]` array in `home-summary` (difficulty-based, up to 3) | The stats endpoint already has a simple `recommended` field based on least-complete module — this is separate and will coexist |
| No spaced repetition | SM-2 via `ReviewSchedule` | SM-2 is the same algorithm used by Anki, SuperMemo, Duolingo |

---

## Open Questions

1. **Lesson player navigation target for Review Today**
   - What we know: Review Today cards should navigate directly to a specific lesson. Current normal flow navigates to `/play/${moduleSlug}` which lets the user pick a lesson.
   - What's unclear: Whether the LessonPlayer accepts a `lessonSlug` as a route param or query string to auto-start a specific lesson.
   - Recommendation: Check `client/src/App.jsx` routes and `LessonPlayer` component before implementing. If no direct-lesson navigation exists, Review Today cards can navigate to the module page — acceptable for v1.

2. **`moduleId` vs `moduleSlug` in transaction**
   - What we know: `ModuleDifficulty` uses `moduleSlug` as the composite key field. The `lesson` record in `progress.js` is fetched `include: { module: true }` (line 200), so both `lesson.module.id` and `lesson.module.slug` are available in the route.
   - What's unclear: Whether to pass `moduleSlug` or `moduleId` into `upsertProgress`. The `ModuleDifficulty` composite key is `@@unique([kidId, moduleSlug])`, so `moduleSlug` is needed.
   - Recommendation: Pass `moduleSlug` (string, e.g., `"alphabet"`) from the route into `entry.moduleSlug`.

3. **lessonScorePct computation inside the transaction**
   - What we know: The "current lesson's best score" for ReviewSchedule creation needs to be a single number representing this lesson's score on the current attempt.
   - What's unclear: Should it use the current entry's raw scores (this attempt) or the post-upsert best scores (all-time best from `record`)?
   - Recommendation: Use the per-lesson best from the `record` (post-upsert) to reflect the kid's current best performance, which is consistent with how `ModuleDifficulty` accuracy is computed.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd server && npx vitest run tests/adaptive/` |
| Full suite command | `cd server && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADL-01 | `ModuleDifficulty.upsert` called inside `$transaction` when lesson saved | unit | `cd server && npx vitest run tests/adaptive/adl01-difficulty-write.test.js` | Wave 0 |
| ADL-01 | `ReviewSchedule.create` triggered when score < hard threshold (no existing row) | unit | `cd server && npx vitest run tests/adaptive/adl01-difficulty-write.test.js` | Wave 0 |
| ADL-01 | `ReviewSchedule.update` (SM-2) triggered on subsequent save when row exists | unit | `cd server && npx vitest run tests/adaptive/adl01-difficulty-write.test.js` | Wave 0 |
| ADL-01 | SM-2 `applySM2()` pure function returns correct interval/easeFactor for q>=3 and q<3 | unit | `cd server && npx vitest run tests/adaptive/adl01-difficulty-write.test.js` | Wave 0 |
| ADL-02 | `home-summary` returns `recommendations[]` with medium-band modules (server-side) | integration | `cd server && npx vitest run tests/adaptive/adl02-recommendations.test.js` | Wave 0 |
| ADL-02 | `home-summary` fills with untried modules when fewer than 3 medium-band found | integration | `cd server && npx vitest run tests/adaptive/adl02-recommendations.test.js` | Wave 0 |
| ADL-02 | `home-summary` omits `recommendations` key (or returns empty array) when no medium + no untried | integration | `cd server && npx vitest run tests/adaptive/adl02-recommendations.test.js` | Wave 0 |
| ADL-03 | `home-summary` returns `reviewToday[]` with lessons where dueDate <= today | integration | `cd server && npx vitest run tests/adaptive/adl03-review-today.test.js` | Wave 0 |
| ADL-03 | `reviewToday` capped at 3 items, sorted by lowest accuracy first | integration | `cd server && npx vitest run tests/adaptive/adl03-review-today.test.js` | Wave 0 |
| ADL-03 | `reviewToday` empty when no lessons due | integration | `cd server && npx vitest run tests/adaptive/adl03-review-today.test.js` | Wave 0 |

### Regression Tests to Update

| Test File | What Must Be Added | Why |
|-----------|-------------------|-----|
| `tests/performance/perf02-transaction.test.js` | Add `moduleDifficulty: { upsert: vi.fn() }` and `reviewSchedule: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }` to `txMock` | Transaction callback now calls these — test will throw without them |
| `tests/performance/perf01-home-summary.test.js` | Add `vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([])` and `vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([])` to `beforeEach` | `home-summary` now queries these tables |

### Sampling Rate

- **Per task commit:** `cd server && npx vitest run tests/adaptive/`
- **Per wave merge:** `cd server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/adaptive/adl01-difficulty-write.test.js` — covers ADL-01 (SM-2 logic, ModuleDifficulty upsert, ReviewSchedule create/update)
- [ ] `server/tests/adaptive/adl02-recommendations.test.js` — covers ADL-02 (home-summary recommendations)
- [ ] `server/tests/adaptive/adl03-review-today.test.js` — covers ADL-03 (home-summary reviewToday)

No new framework install needed — Vitest already installed.

---

## Sources

### Primary (HIGH confidence)

- Direct read: `server/prisma/schema.prisma` — `ModuleDifficulty` and `ReviewSchedule` model fields, unique constraints, relations
- Direct read: `server/src/services/progressSync.js` — `$transaction` structure, `SCORE_FIELDS`, signature
- Direct read: `server/src/routes/kids.js` — `home-summary` `Promise.all` pattern, response shape, `resolveKidAccess` return value
- Direct read: `server/src/routes/progress.js` — `lesson.include.module` availability, `upsertProgress` call sites
- Direct read: `client/src/pages/KidHome.jsx` — component structure, state variables, styles object, inline style pattern
- Direct read: `server/tests/performance/perf01-home-summary.test.js` — mock pattern for `home-summary` (which Prisma models are mocked)
- Direct read: `server/tests/performance/perf02-transaction.test.js` — `$transaction` mock callback structure
- Direct read: `server/tests/helpers/setup.js` — `setTestEnv()`, `getTestKidToken()`, `spyOnPrisma()` patterns
- Direct read: `.planning/phases/06-adaptive-learning/06-CONTEXT.md` — all locked algorithm decisions

### Secondary (MEDIUM confidence)

- SM-2 algorithm original formula: well-established public domain algorithm used identically by Anki, SuperMemo. The formula in CONTEXT.md matches the canonical SM-2 specification.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing packages confirmed from `server/package.json`
- Architecture: HIGH — all patterns derived from direct codebase inspection, not inference
- Pitfalls: HIGH — pitfalls 1–4 derived from direct analysis of test mocking patterns and code paths; pitfall 5 from schema inspection
- SM-2 algorithm: HIGH — formula locked in CONTEXT.md, matches canonical SM-2 specification

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (stable — no fast-moving dependencies)
