# Architecture Patterns

**Project:** KidsLearn — v1.1 Logic & Reasoning (new game types: sort, trueFalse, memoryMatch)
**Researched:** 2026-03-22
**Confidence:** HIGH — based on direct inspection of all integration points

---

## How the Current Architecture Works

Before documenting new patterns, here is the exact data flow for any game type today:

```
static JS module (client/src/data/modules/*.js)
  → MODULE_REGISTRY (client/src/data/index.js)
    → MiniGame.jsx page (reads mod.games[], mod.lessons[])
      → game component (QuizGame, MatchingGame, etc.)
        → onComplete(score: 0-100) callback
          → MiniGame.handleGameComplete()
            → POST /api/progress/:kidId/lesson/:lessonSlug
              → progressSync.upsertProgress()
                → LessonProgress row (score columns + starsEarned)
                → ModuleDifficulty upsert
                → ReviewSchedule via SM-2
```

Every game type in the system follows this contract without exception:

```
Component props:  { lessons: Lesson[], onComplete: (score: number) => void }
Score range:      0–100 integer
Side effects:     none — component is pure UI, all persistence is in MiniGame.jsx
```

---

## Recommended Architecture for New Game Types

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `SortGame.jsx` | Drag/tap ordering UI, emits 0-100 score | MiniGame.jsx via `onComplete` |
| `TrueFalseGame.jsx` | Tap True/False UI, emits 0-100 score | MiniGame.jsx via `onComplete` |
| `MemoryMatchGame.jsx` | Flip-card pair matching UI, emits 0-100 score | MiniGame.jsx via `onComplete` |
| `logic.js` (data module) | Lesson data with `sort`, `trueFalse`, `memoryMatch` gameType lessons | `data/index.js` MODULE_REGISTRY |
| `MiniGame.jsx` (modified) | Routes new gameType strings to new components; maps score to new DB fields | progress API |
| `progress.js` route (modified) | Destructures 3 new score fields from `req.body` | progressSync service |
| `progressSync.js` (modified) | Adds 3 new fields to `SCORE_FIELDS` array | Prisma LessonProgress model |
| Prisma migration | Adds `sortScore`, `trueFalseScore`, `memoryMatchScore` columns | LessonProgress table |

### Data Flow

```
logic.js lessons (sort/trueFalse/memoryMatch typed)
  → MiniGame.jsx reads mod.games = ['sort','trueFalse','memoryMatch']
    → renders SortGame / TrueFalseGame / MemoryMatchGame
      → onComplete(score)
        → MiniGame maps gameType → sortScore / trueFalseScore / memoryMatchScore
          → POST /api/progress/:kidId/lesson/:lessonSlug { sortScore: N }
            → progress.js destructures sortScore, trueFalseScore, memoryMatchScore
              → upsertProgress() includes new fields in SCORE_FIELDS
                → Prisma writes to new LessonProgress columns
                  → computeStars() automatically picks them up (iterates SCORE_FIELDS)
```

---

## Lesson Data Structures

Each new game type requires a distinct `content` shape in the lesson object. These live in `logic.js`.

### sort — Order by attribute

```js
{
  slug: 'sort-size-animals',
  word: 'Big to Small',
  emoji: '📏',
  gameType: 'sort',
  ageGroup: '4-6',         // optional: filter shown to age-appropriate kids
  sortAttribute: 'size',   // 'size' | 'count' | 'sequence'
  prompt: 'Put in order: biggest first!',
  items: [
    { id: 'elephant', emoji: '🐘', label: 'Elephant', correctOrder: 1 },
    { id: 'dog',      emoji: '🐕', label: 'Dog',      correctOrder: 2 },
    { id: 'mouse',    emoji: '🐭', label: 'Mouse',    correctOrder: 3 },
  ],
}
```

`correctOrder` is 1-based rank. The component scores by counting items in correct position.

**Score formula:** `Math.round((correctPositions / items.length) * 100)`

### trueFalse — Tap True or False

```js
{
  slug: 'tf-sky-is-blue',
  word: 'Sky is Blue',
  emoji: '☁️',
  gameType: 'trueFalse',
  ageGroup: '4-6',
  statements: [
    { id: 'sky-blue',       text: 'The sky is blue.',         emoji: '☁️',  answer: true  },
    { id: 'grass-purple',   text: 'Grass is purple.',         emoji: '🌿',  answer: false },
    { id: 'sun-shines',     text: 'The sun gives us light.',  emoji: '☀️',  answer: true  },
    { id: 'fish-fly',       text: 'Fish can fly.',            emoji: '🐟',  answer: false },
  ],
}
```

For age group 4-6: rely on `emoji` for context rather than text. The component can display both but speak the statement aloud via `speakWord`. For 6-8: text-only reading is appropriate.

**Score formula:** `Math.round((correct / statements.length) * 100)`

### memoryMatch — Flip card pairs

```js
{
  slug: 'memory-animals-pairs',
  word: 'Animal Match',
  emoji: '🃏',
  gameType: 'memoryMatch',
  ageGroup: '4-6',
  gridSize: 4,    // 4 = 4x2 (8 cards, 4 pairs); 6 = 4x3 (12 cards, 6 pairs) for 6-8
  pairs: [
    { id: 'cat',  front: { type: 'emoji', content: '🐱' }, back: { type: 'word', content: 'Cat' } },
    { id: 'dog',  front: { type: 'emoji', content: '🐶' }, back: { type: 'word', content: 'Dog' } },
    { id: 'fish', front: { type: 'emoji', content: '🐟' }, back: { type: 'word', content: 'Fish' } },
    { id: 'bird', front: { type: 'emoji', content: '🦜' }, back: { type: 'word', content: 'Bird' } },
  ],
}
```

Note: `memoryMatch` is a self-contained lesson — the component uses `lesson.pairs` directly, not `mod.lessons`. This mirrors how `PatternGame` and `OddOneOutGame` already consume per-lesson `sequence`/`items` fields rather than iterating all module lessons.

**Score formula:** `Math.max(0, 100 - extraAttempts * 8)` — same as existing MatchingGame.

---

## Age-Adaptive Difficulty

`kid.ageGroup` is already threaded through to `upsertProgress()` and SM-2 thresholds. For the new game types, age-adaptive difficulty operates at the **content level**, not the component level:

| ageGroup | sort | trueFalse | memoryMatch |
|----------|------|-----------|-------------|
| `4-6` | 3 items, size/count only | emoji + audio, 4 statements | 4 pairs (8 cards) |
| `6-8` | 4-5 items, sequence included | text-forward, 6 statements | 6 pairs (12 cards) |

Each lesson in `logic.js` should carry an `ageGroup` field. The component reads `lesson.ageGroup` (or receives it as a prop) to adjust rendering. The `mod.games` array in `logic.js` should include distinct per-ageGroup lesson sets filtered by the parent page before passing to `MiniGame`.

The simplest approach: add two lesson sets to `logic.js` (one per ageGroup), and let the module page filter `mod.lessons.filter(l => l.ageGroup === kid.ageGroup || !l.ageGroup)` before routing to MiniGame.

---

## Integration Points — New vs Modified

### New Files (create from scratch)

| File | What it does |
|------|-------------|
| `client/src/components/games/SortGame.jsx` | Drag/tap ordering by attribute |
| `client/src/components/games/TrueFalseGame.jsx` | Tap True/False statement quiz |
| `client/src/components/games/MemoryMatchGame.jsx` | Flip card pairs (wraps or replaces existing MatchingGame for logic module use) |
| `server/prisma/migrations/YYYYMMDD_add_new_game_scores/` | DB migration adding 3 columns |

### Modified Files (targeted edits only)

| File | What changes | Risk |
|------|-------------|------|
| `client/src/pages/MiniGame.jsx` | Import 3 new components; add 3 `if (gameType === ...)` score-mapping blocks; add 3 badge labels | LOW — additive only |
| `client/src/data/modules/logic.js` | Add sort/trueFalse/memoryMatch typed lessons; update `mod.games` array | LOW — additive only |
| `server/src/routes/progress.js` | Destructure 3 new score fields in POST handler body | LOW — 3-line addition |
| `server/src/services/progressSync.js` | Add 3 fields to `SCORE_FIELDS` array | LOW — 1-line edit |
| `server/prisma/schema.prisma` | Add `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` to `LessonProgress` | LOW — nullable columns |

### Unchanged (verified by inspection)

| System | Why no change needed |
|--------|---------------------|
| `computeStars()` in progressSync.js | Already iterates `SCORE_FIELDS` dynamically — new fields auto-included |
| SM-2 review scheduling | Already uses `Math.max(...lessonScores)` across `SCORE_FIELDS` — new fields auto-included |
| ModuleDifficulty accuracy calculation | Same — reads from SCORE_FIELDS dynamically |
| `gameAccuracy` in stats endpoint | Currently enumerates game types manually — see pitfall below |
| Freemium gate | Module slug-based; logic module will follow same free/premium rule as others |
| Coins/streak/achievement system | Score-agnostic; `starDelta > 0` path handles all game types uniformly |

---

## Patterns to Follow

### Pattern 1: Component Contract — Props In, Score Out

Every game component receives `{ lessons, onComplete }` and calls `onComplete(score)` with a single integer 0-100. No component writes to the API or touches context. This keeps games fully testable in isolation.

For `memoryMatch` and `sort`, `lessons` will typically be an array of one (the active lesson), since these game types are per-lesson rather than per-module. Follow the precedent of `PatternGame` and `OddOneOutGame`, which already exhibit this pattern.

### Pattern 2: Additive Score Columns

Each game type gets its own nullable `Int?` column in `LessonProgress`. The `SCORE_FIELDS` array in `progressSync.js` is the authoritative registry. Adding a field there cascades automatically to `computeStars`, `SM-2`, and `ModuleDifficulty` — no further changes needed in those systems.

### Pattern 3: Best-Score Preservation

`progressSync.js` uses `maxScore(entry[field], existing?.[field])` for all score fields. New game types get this behavior for free just by being in `SCORE_FIELDS`.

### Pattern 4: Emoji-First for 4-6

All UI for age 4-6 relies on emojis/images, never text-only prompts. `speakWord()` from `lib/sound` handles audio. Follow `QuizGame.jsx` which auto-speaks the question on mount via `useEffect`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Lesson Score Fields in the Logic Module

**What:** Storing scores differently per game type (e.g., per-statement scores in DB).
**Why bad:** Every score persisted is a nullable column. Adding granular per-statement breakdown requires a separate table and schema migration, violating the single-integer score contract the entire system depends on.
**Instead:** Aggregate to 0-100 inside the component before calling `onComplete`.

### Anti-Pattern 2: Reusing MatchingGame for memoryMatch

**What:** Pointing `mod.games = ['matching']` in `logic.js` and relying on the existing `MatchingGame` component.
**Why bad:** `MatchingGame` sources its pairs from `mod.lessons` (image/word pairs), not from a `lesson.pairs` content field. The logic module's memory-match lessons need custom pair definitions (emoji-to-word, category-to-example). Reuse would require either contaminating the `MatchingGame` API or forcing logic lessons to conform to the existing alphabet/numbers lesson shape.
**Instead:** Create a new `MemoryMatchGame.jsx` that reads `lesson.pairs`. The existing `MatchingGame` stays unchanged.

### Anti-Pattern 3: Hardcoding ageGroup Branches Inside Components

**What:** `if (kid.ageGroup === '4-6') { showFewerCards } else { showMoreCards }` inside game components.
**Why bad:** ageGroup becomes a cross-cutting concern that reaches into UI components. Testing doubles in complexity.
**Instead:** Pass age-appropriate lesson data into the component. The data layer (lesson content in `logic.js`) controls difficulty. The component renders whatever it receives.

### Anti-Pattern 4: Forgetting gameAccuracy in the Stats Endpoint

**What:** Adding score columns to `SCORE_FIELDS` but not updating the `gameAccuracy` object in `GET /api/progress/:kidId/stats`.
**Why bad:** The parent analytics dashboard shows per-game accuracy. New game types will silently be absent from analytics even though scores are recording correctly.
**Instead:** Add `sort`, `trueFalse`, `memoryMatch` keys to the `gameAccuracy` response object in `progress.js` (lines 154-159 of the current file). This is a 3-line addition.

---

## Suggested Build Order

Dependencies must be respected. The order below ensures each step is independently testable.

### Step 1: DB Migration + Schema (no client changes yet)

Add `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` to `LessonProgress` in `schema.prisma`. Run migration. Deploy to Railway.

**Why first:** Server changes depend on DB columns existing. Migrations on Railway require a deploy cycle. Front-end can deploy before or after since columns are nullable — old code writing no value is safe.

### Step 2: Server — progressSync + progress route

Add the 3 fields to `SCORE_FIELDS` in `progressSync.js`. Add them to the `req.body` destructure in `progress.js` POST handler. Add 3 keys to `gameAccuracy` in the stats GET handler.

**Why second:** Unblocks the ability to persist new game scores end-to-end. All downstream systems (computeStars, SM-2, ModuleDifficulty) inherit changes automatically.

### Step 3: Logic Module Content Data

Add sort, trueFalse, and memoryMatch typed lessons to `logic.js`. Update `mod.games` to include the new game type strings. Write age-group variants for all three types.

**Why third:** Game components need real lesson data to render against during development. Data is client-side static JS — zero deploy risk.

### Step 4: TrueFalseGame Component

Build first because it is the simplest interaction model (two buttons, one correct answer per statement). Validate the full end-to-end flow — lesson data in, score recorded in DB — before building more complex interactions.

**Why fourth:** Lowest-risk validation of the integration contract. If score recording is broken, discover here before investing in drag mechanics.

### Step 5: SortGame Component

Build next. Tap-to-select ordering (no native drag-and-drop — touch handling on mobile is complex and fragile). Use a "select source, then tap target position" interaction model that works reliably on both mobile and desktop.

**Why fifth:** More complex than TrueFalseGame (multi-step interaction) but simpler than flip animation.

### Step 6: MemoryMatchGame Component

Build last. Has the most stateful interaction (flip, lock, match, delay cycles) and requires careful animation without CSS Modules or Framer Motion (consistent with existing pattern of inline `styles` objects).

**Why last:** Benefits from patterns established in SortGame and TrueFalseGame. Reference MatchingGame for the locked/flipped/matched state machine — the core logic is identical.

### Step 7: MiniGame.jsx Wiring

Import all three components. Add score-mapping conditionals and badge labels. Verify end-to-end with the logic module.

**Why last:** Pure assembly step. All components and data are already proven individually.

---

## Scalability Considerations

| Concern | Current scale | With new game types |
|---------|--------------|---------------------|
| `SCORE_FIELDS` array growth | 8 fields | 11 fields — negligible |
| LessonProgress row width | 8 nullable score columns | 11 columns — still well within Postgres row limits |
| `gameAccuracy` stats query | Reads all LessonProgress rows for a kid | Same query, 3 extra field reads — no new DB queries needed |
| Content bundle size | 13 modules, ~157 lessons in static JS | Adds ~15-20 lessons to logic.js — negligible |
| Component count | 8 game components | 11 — no change to routing strategy needed |

---

## Sources

- Direct code inspection: `client/src/pages/MiniGame.jsx` (game routing), `server/src/services/progressSync.js` (SCORE_FIELDS, computeStars, SM-2), `server/src/routes/progress.js` (req.body destructure, gameAccuracy), `server/prisma/schema.prisma` (LessonProgress columns), `client/src/data/modules/logic.js` (existing lesson shapes), `client/src/components/games/MatchingGame.jsx` (flip-card state machine reference)
- Confidence: HIGH — all findings from first-party source code, not external documentation
