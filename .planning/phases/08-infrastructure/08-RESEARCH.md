# Phase 8: Infrastructure - Research

**Researched:** 2026-03-22
**Domain:** Prisma migration, Express route wiring, React gameType dispatch
**Confidence:** HIGH

## Summary

Phase 8 is a pure wiring phase: no new UI, no new game logic. The goal is to plumb three new score columns through every layer that touches `LessonProgress` so that when Phase 9 game components call `recordLesson()`, values land in the DB, stars compute correctly, and the analytics endpoint exposes them to parents.

All four requirements touch the same data field set: `sortScore`, `trueFalseScore`, `memoryMatchScore`. These three column names must be added consistently in five specific locations: the Prisma schema and a migration SQL file (INFRA-01), the `SCORE_FIELDS` array and the hard-coded `select` block inside `progressSync.js` (INFRA-02), the POST route destructure in `progress.js` (also INFRA-02 — the route passes named fields to `upsertProgress`), the `select` block in `GET /api/progress/:kidId/stats` and its `gameAccuracy` response object (INFRA-04), and the `handleGameComplete` dispatch chain in `MiniGame.jsx` (INFRA-03).

The project uses Prisma 7 with `@prisma/adapter-pg` against Supabase (session-mode pooler). The scramble score migration (`20260318000000_add_scramble_score`) is the direct precedent for adding a nullable `Int` column: raw SQL `ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "scrambleScore" INTEGER;`. That exact pattern repeats three times here.

**Primary recommendation:** Treat the `SCORE_FIELDS` array as the single source of truth for scoring logic; once three new field names are added there, `computeStars`, coins, and SM-2 all work automatically. All other changes are mechanical propagation of those same three strings.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Prisma migration adds `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` to `LessonProgress` | Schema model mapped; migration SQL pattern confirmed from `20260318000000_add_scramble_score` |
| INFRA-02 | `SCORE_FIELDS` in `progressSync.js` includes all 3 new field names | Array at line 4 of `progressSync.js` identified; two downstream hard-coded field lists also need updating |
| INFRA-03 | `MiniGame.jsx` routing block handles `sort`, `trueFalse`, and `memoryMatch` gameType strings | Dispatch chain in `handleGameComplete` identified; current pattern is 8 `if` statements, 3 more added |
| INFRA-04 | `gameAccuracy` in `GET /api/progress/:kidId/stats` includes the 3 new keys | `select` block and response shape in `progress.js` lines 98-121 identified; both need extending |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.4.2 (already installed) | ORM, migration runner | Already in use; no change |
| Vitest | 3.2.4 (already installed) | Test runner | Already in use |

### Supporting
No new library installs required. This phase is pure code changes within the existing stack.

**Installation:**
```bash
# No new packages. After schema edit:
npx prisma migrate dev --name add_new_game_scores
```

## Architecture Patterns

### Pattern 1: Adding a nullable score column (precedent: scramble)

**What:** Add a raw SQL migration file and update `schema.prisma`
**When to use:** Every time a new game type is added
**Example:**
```sql
-- Source: server/prisma/migrations/20260318000000_add_scramble_score/migration.sql
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "scrambleScore" INTEGER;
```
The new migration adds three columns in one file:
```sql
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "sortScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "trueFalseScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "memoryMatchScore" INTEGER;
```

### Pattern 2: SCORE_FIELDS as single registry

**What:** `SCORE_FIELDS` array in `progressSync.js` drives `computeStars`, the `upsert` `scoreData` loop, the SM-2 score extraction, and the module accuracy calculation.
**When to use:** New field → add to array → everything else is automatic EXCEPT two hard-coded `select` blocks that must also be updated manually.
**Example:**
```js
// Source: server/src/services/progressSync.js line 4
const SCORE_FIELDS = ['matchScore', 'traceScore', 'quizScore', 'spellingScore',
  'phonicsScore', 'patternScore', 'oddOneOutScore', 'scrambleScore'];
// INFRA-02: append 'sortScore', 'trueFalseScore', 'memoryMatchScore'
```

### Pattern 3: Hard-coded select blocks that shadow SCORE_FIELDS

There are TWO places where score fields are listed explicitly rather than derived from `SCORE_FIELDS`. Both must be updated alongside the array.

**Location 1 — module accuracy query inside `upsertProgress` (line 74):**
```js
// server/src/services/progressSync.js lines 74-78
select: {
  matchScore: true, traceScore: true, quizScore: true, spellingScore: true,
  phonicsScore: true, patternScore: true, oddOneOutScore: true, scrambleScore: true,
}
```

**Location 2 — stats endpoint query (line 98-103):**
```js
// server/src/routes/progress.js lines 98-103
select: {
  matchScore: true, traceScore: true, quizScore: true,
  spellingScore: true, phonicsScore: true, patternScore: true, oddOneOutScore: true,
  starsEarned: true, updatedAt: true,
},
```
Note: `scrambleScore` is missing from this select entirely — a pre-existing gap. Adding all three new fields here also provides the opportunity to add `scrambleScore` for completeness.

### Pattern 4: stats endpoint gameAccuracy shape

The `GET /api/progress/:kidId/stats` response builds `gameAccuracy` by computing per-field averages:
```js
// server/src/routes/progress.js lines 114-121
const matchScores    = allProgress.filter(p => p.matchScore != null).map(p => p.matchScore);
// ... (one line per field)
gameAccuracy: {
  match: avg(matchScores), trace: avg(traceScores), quiz: avg(quizScores),
  spelling: avg(spellingScores), phonics: avg(phonicsScores),
  pattern: avg(patternScores), oddOneOut: avg(oddOneOutScores),
},
```
Three new lines of filter+map and three new keys in the `gameAccuracy` object are needed.

### Pattern 5: MiniGame.jsx gameType dispatch

```jsx
// client/src/pages/MiniGame.jsx lines 41-48
if (gameType === 'matching')  update.matchScore      = score;
if (gameType === 'tracing')   update.traceScore      = score;
// ...
if (gameType === 'scramble')  update.scrambleScore   = score;
// INFRA-03: add:
if (gameType === 'sort')        update.sortScore        = score;
if (gameType === 'trueFalse')   update.trueFalseScore   = score;
if (gameType === 'memoryMatch') update.memoryMatchScore = score;
```
The `gameBadge` label ternary chain (lines 66-73) should also get display labels for the three new game types; without them, new game types fall through to `'❓ Quiz'` label — not a scoring bug, but visible to the user.

### Pattern 6: POST route body destructure

```js
// server/src/routes/progress.js lines 224-228
const {
  viewed,
  matchScore, traceScore, quizScore, spellingScore,
  phonicsScore, patternScore, oddOneOutScore, scrambleScore,
} = req.body;
```
Three new field names must be destructured and passed to `upsertProgress`. Without this step, `progressSync` receives `undefined` for the new fields and `maxScore(undefined, null)` returns `null` — scores silently write null even when the client sends a value.

### Recommended Change Map

| File | Change | Requirement |
|------|--------|-------------|
| `server/prisma/schema.prisma` | Add 3 `Int?` fields to `LessonProgress` model | INFRA-01 |
| `server/prisma/migrations/20260322…/migration.sql` | 3 `ALTER TABLE ADD COLUMN IF NOT EXISTS` | INFRA-01 |
| `server/src/services/progressSync.js` line 4 | Extend `SCORE_FIELDS` array with 3 strings | INFRA-02 |
| `server/src/services/progressSync.js` line 74 select | Add 3 fields to hard-coded select | INFRA-02 |
| `server/src/routes/progress.js` line 98 select | Add 3 fields (+ fix missing scrambleScore) | INFRA-04 |
| `server/src/routes/progress.js` line 224 destructure | Destructure 3 new fields from req.body | INFRA-02 |
| `server/src/routes/progress.js` line 230 upsertProgress call | Pass 3 new fields in entry object | INFRA-02 |
| `server/src/routes/progress.js` gameAccuracy block | Add filter+map+avg lines + 3 keys in response | INFRA-04 |
| `client/src/pages/MiniGame.jsx` handleGameComplete | Add 3 `if` branches for new gameType strings | INFRA-03 |
| `client/src/pages/MiniGame.jsx` gameBadge ternary | Add display labels for 3 new game types | INFRA-03 (label) |

### Anti-Patterns to Avoid

- **Schema edit without migration file:** `prisma migrate dev` in local dev will auto-generate SQL, but the Railway deploy uses `prisma migrate deploy` which only applies committed migration files. Create the SQL file manually alongside the schema change.
- **Adding to SCORE_FIELDS but not the select blocks:** The two hard-coded `select` objects do not derive from `SCORE_FIELDS`. Missing a select means Prisma returns `undefined` for that field, causing the max-score preservation logic to silently drop new scores.
- **Destructuring fields in the route but not passing them to upsertProgress:** The POST handler destructures fields from `req.body`, then passes them explicitly to `upsertProgress`. If a new field is destructured but not included in the `upsertProgress` call, it is silently dropped before reaching the DB.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column migration | Custom DB script | Prisma migrate dev (with manually authored SQL) | Prisma tracks migration state; raw scripts outside the migrations folder break `migrate status` |
| Best-score preservation | Re-implement maxScore | `maxScore()` helper already in progressSync.js | Already handles all null/undefined edge cases |
| Star recomputation | New computeStars logic per game type | Extend SCORE_FIELDS — computeStars uses the array | computeStars is already general-purpose |

**Key insight:** The existing abstractions (`SCORE_FIELDS`, `computeStars`, `maxScore`, `upsertProgress`) are designed for exactly this extension pattern. Phase 8 is mechanical propagation, not new logic.

## Common Pitfalls

### Pitfall 1: Three new columns, five touch points
**What goes wrong:** Developer adds DB columns and SCORE_FIELDS but misses either the select block in `progressSync.js` line 74, the stats route select, the POST body destructure, or the MiniGame dispatch. The build succeeds and no error is thrown; scores silently write as null.
**Why it happens:** The propagation is spread across three files and two `select` blocks that shadow the authoritative array.
**How to avoid:** Use the change map above as a checklist; verify each touch point before running tests.
**Warning signs:** Test sends a score > 0 but DB row shows null; `gameAccuracy` response omits or returns null for new keys.

### Pitfall 2: Migration timestamp collision
**What goes wrong:** `prisma migrate dev` generates a migration with a timestamp earlier than the last applied migration, causing `migrate deploy` on Railway to skip or fail it.
**Why it happens:** Local clock vs CI/deploy timestamp ordering.
**How to avoid:** Use a future-safe timestamp (e.g. `20260322000000_add_new_game_scores`) when naming the migration directory manually, or always use `prisma migrate dev` to generate the directory name.

### Pitfall 3: Missing `scrambleScore` in stats endpoint (pre-existing)
**What goes wrong:** `scrambleScore` is already absent from the `GET /api/progress/:kidId/stats` select and gameAccuracy response. Phase 8 is the right time to fix this alongside the three new fields.
**Why it happens:** The stats endpoint was not updated when `scrambleScore` was added in Phase 7.
**How to avoid:** Add `scrambleScore` to the select and response when adding the three new fields.

### Pitfall 4: MiniGame gameBadge label falls through
**What goes wrong:** The ternary chain for `gameBadge` has no branch for `sort`, `trueFalse`, or `memoryMatch`, so the badge shows `'❓ Quiz'` for all three. No scoring bug, but confusing for users.
**Why it happens:** The ternary is a manual list (not derived from game metadata).
**How to avoid:** Add label entries for the three new gameType strings in the same commit as the dispatch `if` blocks.

## Code Examples

### INFRA-01: Schema addition
```prisma
// server/prisma/schema.prisma — LessonProgress model
model LessonProgress {
  // ... existing fields ...
  scrambleScore  Int?
  sortScore      Int?
  trueFalseScore Int?
  memoryMatchScore Int?
  // ...
}
```

### INFRA-01: Migration SQL
```sql
-- server/prisma/migrations/20260322000000_add_new_game_scores/migration.sql
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "sortScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "trueFalseScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "memoryMatchScore" INTEGER;
```

### INFRA-02: SCORE_FIELDS extension
```js
// server/src/services/progressSync.js
const SCORE_FIELDS = [
  'matchScore', 'traceScore', 'quizScore', 'spellingScore',
  'phonicsScore', 'patternScore', 'oddOneOutScore', 'scrambleScore',
  'sortScore', 'trueFalseScore', 'memoryMatchScore',   // added
];
```

### INFRA-03: MiniGame dispatch
```jsx
// client/src/pages/MiniGame.jsx — inside handleGameComplete
if (gameType === 'sort')        update.sortScore        = score;
if (gameType === 'trueFalse')   update.trueFalseScore   = score;
if (gameType === 'memoryMatch') update.memoryMatchScore = score;
```

### INFRA-04: Stats endpoint gameAccuracy
```js
// server/src/routes/progress.js — inside GET /:kidId/stats
const sortScores        = allProgress.filter(p => p.sortScore        != null).map(p => p.sortScore);
const trueFalseScores   = allProgress.filter(p => p.trueFalseScore   != null).map(p => p.trueFalseScore);
const memoryMatchScores = allProgress.filter(p => p.memoryMatchScore != null).map(p => p.memoryMatchScore);

// in the response:
gameAccuracy: {
  // ... existing keys ...
  sortScore:        avg(sortScores),
  trueFalseScore:   avg(trueFalseScores),
  memoryMatchScore: avg(memoryMatchScores),
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct `prisma.migrate.deploy` with schema-generated SQL | Manually authored migration SQL committed alongside schema | Already established (see scramble migration) | Railway deploy uses `migrate deploy`; manually authored SQL is required |

**Deprecated/outdated:**
- Nothing deprecated in this phase. The existing patterns are current.

## Open Questions

1. **Should `scrambleScore` be added to the stats endpoint in this phase?**
   - What we know: It is missing from the current stats `select` and `gameAccuracy` response; this is a pre-existing gap from Phase 7.
   - What's unclear: Whether fixing it now is in scope for Phase 8 or should be a separate ticket.
   - Recommendation: Fix it in the INFRA-04 task. Adding one more field to the same select/response block costs nothing and closes the gap cleanly. Document it in the plan as an incidental fix.

2. **Should `gameBadge` labels for new game types be in Plan 08-01 or 08-02?**
   - What we know: INFRA-03 (MiniGame routing) is Plan 08-02. The gameBadge fix belongs in the same commit.
   - What's unclear: Nothing — place it in Plan 08-02 alongside INFRA-03.
   - Recommendation: Include in 08-02 as a non-negotiable co-change.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd server && npx vitest run tests/adaptive/ tests/helpers/` |
| Full suite command | `cd server && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | DB columns accept non-null values for all 3 new score fields | unit (progressSync mock) | `cd server && npx vitest run tests/adaptive/` | ❌ Wave 0 |
| INFRA-02 | `computeStars` returns 3 stars when all 3 new scores >= 80; `SCORE_FIELDS` drives SM-2 with new fields | unit (progressSync mock) | `cd server && npx vitest run tests/adaptive/infra01-score-fields.test.js` | ❌ Wave 0 |
| INFRA-03 | `MiniGame` dispatches `sort`, `trueFalse`, `memoryMatch` to correct score keys (no fall-through) | unit (component + vitest) | `cd server && npx vitest run tests/adaptive/infra01-score-fields.test.js` | ❌ Wave 0 |
| INFRA-04 | Stats endpoint `gameAccuracy` includes `sortScore`, `trueFalseScore`, `memoryMatchScore` keys | unit (route mock via spyOnPrisma) | `cd server && npx vitest run tests/adaptive/infra02-stats-endpoint.test.js` | ❌ Wave 0 |

**Note on INFRA-03:** MiniGame.jsx is a React component in the client. The dispatch logic in `handleGameComplete` is pure conditional assignment — testable as a pure unit function extracted from the component, or confirmed via the integration path (POST to progress route with new gameType values). The simpler approach is to test the server integration path: POST a progress record with `sortScore` set, verify it lands in the DB mock.

### Sampling Rate
- **Per task commit:** `cd server && npx vitest run tests/adaptive/`
- **Per wave merge:** `cd server && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/tests/adaptive/infra01-score-fields.test.js` — covers INFRA-01, INFRA-02: tests that `computeStars` returns correct values with new score fields, `SCORE_FIELDS` contains all 11 fields, `upsertProgress` persists new fields via mocked tx
- [ ] `server/tests/adaptive/infra02-stats-endpoint.test.js` — covers INFRA-04: tests that `GET /api/progress/:kidId/stats` returns `sortScore`, `trueFalseScore`, `memoryMatchScore` keys in `gameAccuracy` using `spyOnPrisma` pattern from `tests/helpers/setup.js`
- [ ] INFRA-03 MiniGame dispatch is verified by the INFRA-01 integration path (client sends score field in POST body, server persists it); no separate client-side test file needed for Phase 8

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `server/src/services/progressSync.js` (full file)
- Direct codebase read — `server/src/routes/progress.js` (full file)
- Direct codebase read — `client/src/pages/MiniGame.jsx` (full file)
- Direct codebase read — `server/prisma/schema.prisma` (full file)
- Direct codebase read — `server/prisma/migrations/20260318000000_add_scramble_score/migration.sql`
- Direct codebase read — `server/tests/helpers/setup.js`, `server/tests/adaptive/adl01-difficulty-write.test.js`

### Secondary (MEDIUM confidence)
- None needed — all findings are from direct codebase inspection, not external sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing
- Architecture: HIGH — exact file locations, line numbers, and code patterns verified from live source
- Pitfalls: HIGH — derived from direct inspection of the exact files that need changing
- Test patterns: HIGH — spyOnPrisma and tx mock patterns confirmed from existing test files

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable internal codebase; changes only if Phase 9 starts editing these files first)
