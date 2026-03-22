# Project Research Summary

**Project:** KidsLearn v1.1 — Logic & Reasoning (sort, trueFalse, memoryMatch)
**Domain:** Incremental feature addition to existing React kids educational game
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

This is not a greenfield project — it is a targeted extension of an existing, deployed system. KidsLearn already ships 8 game types, a complete progress/scoring pipeline, and an established component contract: game components receive `{ lessons, onComplete }` and emit a 0-100 score. The research confirms that all three new game types (sort, trueFalse, memoryMatch) fit cleanly into this contract without requiring architectural changes. The principal work is additive: 3 new React components, 1 Prisma migration adding 3 nullable score columns, and targeted edits to 4 existing files.

The recommended approach is strictly bottom-up. DB migration and server wiring must ship first because they are shared infrastructure — if score columns or SCORE_FIELDS registration are missing, every game component will silently appear to work while recording nothing. TrueFalseGame ships second (simplest interaction, validates end-to-end persistence), SortGame third (pointer-event touch handling requires care), and MemoryMatchGame last (most stateful, benefits from reusing the MatchingGame flip state machine via a new `pairType` prop rather than a duplicate component). Only SortGame requires a new npm dependency: `@dnd-kit/core` + `@dnd-kit/sortable` — but only for the drag enhancement path. The tap-to-select primary interaction requires no new library.

The top risk is silent failure. Three distinct wiring points (DB columns, SCORE_FIELDS array in progressSync.js, and the gameType→scoreField mapping in MiniGame.jsx) must all be updated together or scores record to null, stars compute wrong, and coins miscalculate — with no visible error to the user. The second risk is touch incompatibility: the HTML5 DnD API does not fire on iOS Safari or Android. SortGame must use pointer events or the tap-to-place interaction model from day one.

---

## Key Findings

### Recommended Stack

No new core framework. All three game types are pure React components following the existing `client/src/components/games/` pattern. The only justified npm addition is `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` + `@dnd-kit/utilities@3.2.2`, installed with `--legacy-peer-deps` due to stale peer dep declarations (React 19 works at runtime; the spec is unmaintained). This is needed only if the drag enhancement for SortGame is built; the tap-to-place MVP requires zero new packages.

**Core technologies:**
- `@dnd-kit/core` 6.3.1: Drag context for SortGame — only correct choice (react-beautiful-dnd archived Aug 2025; react-dnd has no touch support)
- `@dnd-kit/sortable` 10.0.0: `useSortable` + `arrayMove` preset — eliminates manual position math
- CSS `rotateY(180deg)` + `backface-visibility: hidden`: MemoryMatchGame card flip — no animation library needed, already achievable with existing inline-style pattern and `index.css` keyframes

### Expected Features

**Must have (table stakes):**
- Sort: tap-to-select + tap-to-place interaction — HTML5 drag has zero iOS touch support; motor skills of 4-6 year-olds require a reliable primary interaction before drag enhancement
- Sort: `renderSize` CSS variation per item — emoji characters look similar in size without explicit pixel sizing, making size-based sorting impossible to read visually
- TrueFalse: auto-speak claim on load + replay button — ages 4-6 cannot read; TTS is mandatory, not optional
- TrueFalse: large True/False tap targets (min 100px height) with emoji icons — text-only labels are inaccessible to pre-readers
- MemoryMatch: emoji-only pairs — `MatchingGame` already covers emoji+word; memoryMatch must differentiate as emoji-to-emoji for pre-readers
- MemoryMatch: 900ms flip-back on mismatch — matches existing `MatchingGame` pattern, gives kids time to see what they chose
- DB migration: `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` on `LessonProgress` — prerequisite for all score persistence
- MiniGame.jsx wiring: dispatch branches + score-field mapping for all 3 new game types

**Should have (competitive):**
- Sort: drag enhancement via `@dnd-kit` with touch sensors — ages 6-8 prefer drag; deploy only after completion rate validates tap-select works
- Age-adaptive content: 4-6 gets 3-item sort + 4 emoji statements + 4 card pairs; 6-8 gets 5-item sort + 6 text statements + 6 card pairs
- Sort: count + sequence attributes beyond size — reuses `DotGrid` component; extends one game type across future modules

**Defer (v2+):**
- MemoryMatch progressive peek hint — after 3 misses, briefly reveal that pair; high complexity
- TrueFalse image-based claims — requires image asset pipeline for logic module (currently emoji-only)

### Architecture Approach

The existing architecture is a clean unidirectional pipeline: static JS lesson data feeds `MiniGame.jsx`, which routes to game components by `gameType` string. Game components emit a 0-100 score via `onComplete`, `MiniGame` maps it to a named score field, and the server persists it through `progressSync.js`. The critical insight from architecture research is that `SCORE_FIELDS` in `progressSync.js` is the single authoritative registry — adding a field there cascades automatically to `computeStars`, SM-2 scheduling, and `ModuleDifficulty` with no further changes. Conversely, omitting a field from this array silently breaks all downstream star and difficulty logic.

**Major components:**
1. `SortGame.jsx` — tap/drag ordering UI; emits score via `onComplete`; no API access
2. `TrueFalseGame.jsx` — emoji + audio statement quiz; auto-speaks via existing `speakWord`; emits score
3. `MemoryMatchGame.jsx` — flip-card pairs; extend `MatchingGame` with `pairType` prop OR new component reading `lesson.pairs`; emits score
4. Prisma migration — adds 3 nullable `Int?` columns to `LessonProgress`
5. `progressSync.js` + `progress.js` edits — register new score fields; extend `gameAccuracy` stats response

### Critical Pitfalls

1. **SCORE_FIELDS not updated alongside DB migration** — scores write to null, stars compute wrong, SM-2 never fires for new lessons; fix: update array in the same commit as the migration, add a test asserting array length matches column count
2. **MiniGame.jsx gameType routing left incomplete** — game appears to work but writes no score field; star count never changes; fix: update `handleGameComplete` mapping block in the same PR as each new component
3. **HTML5 DnD API used for SortGame** — works on desktop Chrome, completely broken on iOS Safari and Android; fix: use pointer events (`onPointerDown/Move/Up`) or tap-to-place pattern; test on a real device before merge
4. **New lesson slugs absent from DB seed** — progress POST returns 404; `.catch(() => {})` in MiniGame swallows it silently; coins/stars never update; fix: seed all new slugs in the same migration that adds the columns
5. **MemoryMatchGame duplicated from MatchingGame** — two components with near-identical flip state machines diverge over time; fix: audit `MatchingGame.jsx` first and extend with a `pairType` prop rather than writing from scratch; document this decision before writing any code

---

## Implications for Roadmap

Based on research, the build order is firmly dictated by dependency: the server infrastructure must precede any game component work, and integration validation must happen bottom-up. Three phases are sufficient.

### Phase 1: Infrastructure Foundation (DB + Server + Content Data)

**Rationale:** Three independent systems (DB columns, SCORE_FIELDS registration, DB seed, stats endpoint, lesson data) must exist before any game component can be tested end-to-end. Doing this first collapses the silent-failure risk window to near zero — if wiring is broken it will be caught with a single API test before component work begins.

**Delivers:**
- Prisma migration with `sortScore`, `trueFalseScore`, `memoryMatchScore` columns
- `SCORE_FIELDS` array updated in `progressSync.js`
- `progress.js` POST body destructuring updated + `gameAccuracy` stats extended for 3 new keys
- DB seed rows for all new lesson slugs
- `logic.js` lesson content for sort (3-4 rounds), trueFalse (6-8 claims), memoryMatch (4-6 emoji pairs)
- `mod.games` array updated to include new game type strings

**Addresses from FEATURES.md:** DB migration (P1), logic.js lesson content (P1)
**Avoids:** Pitfalls 1 (SCORE_FIELDS), 4 (DB seed missing), freemium gate misconfiguration

### Phase 2: Game Components (TrueFalse → Sort → MemoryMatch)

**Rationale:** Build in complexity order within the phase. TrueFalseGame has no interaction complexity beyond two buttons — it validates the full integration contract before investing in drag mechanics. SortGame introduces touch handling which requires real-device testing. MemoryMatchGame has the most stateful interaction and should benefit from patterns established in the prior two.

**Delivers:**
- `TrueFalseGame.jsx`: emoji + audio claims, auto-speak on load, replay button, 2-button tap, 0-100 score
- `SortGame.jsx`: tap-to-select + tap-to-place ordering, size attribute, 3 items, correct/wrong feedback
- `MemoryMatchGame.jsx`: emoji-only pairs, CSS 3D flip animation, 900ms mismatch timeout, matched pairs locked
- `MiniGame.jsx` updated: import 3 components, add gameType routing + score mapping + badge labels
- CSS keyframes in `index.css`: flip animation, sort-drop feedback

**Uses from STACK.md:** CSS `rotateY` + `backface-visibility` (MemoryMatchGame); tap-to-place pattern (SortGame MVP); existing `speakWord` + `sonner` 2.0.7
**Implements:** Component contract (props in, score out), Pattern 2 (additive score columns), Pattern 4 (emoji-first for 4-6)
**Avoids:** Pitfalls 2 (MiniGame routing), 3 (HTML5 DnD), 5 (ageGroup null fallback), 7 (no pre-reader support)

### Phase 3: Enhancements + Age-Adaptive Content (Post-Validation)

**Rationale:** Defer complexity that requires user data to validate. Drag enhancement for SortGame only makes sense if completion rate signals friction from tap-select. Age-adaptive difficulty only matters once the base content is confirmed engaging.

**Delivers:**
- SortGame drag enhancement via `@dnd-kit/core` (install with `--legacy-peer-deps`)
- Age-adaptive content variants: 4-6 vs 6-8 lesson sets filtered before `MiniGame`
- Age-adaptive card count: 4 pairs for 4-6, 6 pairs for 6-8 in MemoryMatchGame
- ageGroup null fallback (`?? '4-6'`) verified across all three components

**Addresses from FEATURES.md:** P2 items (drag, age-adaptive, count/sequence sort attributes)
**Avoids:** Pitfall 5 (ageGroup null crash), anti-feature (drag-only sort with no tap fallback)

### Phase Ordering Rationale

- Phase 1 first because three separate wiring points (DB, SCORE_FIELDS, seed) create silent failures if missed — catching them before component work begins eliminates the most dangerous debugging scenario
- TrueFalseGame before SortGame because it validates end-to-end score recording with minimal interaction complexity; any persistence bug surfaces here before drag logic is involved
- MemoryMatchGame last because it has the most stateful interaction and the risk of duplicating MatchingGame — the architecture decision (extend vs new component) must be made deliberately before writing any code
- Phase 3 deferred because it requires production signal (completion rates) and is pure enhancement — shipping Phase 2 first gives real data to validate the decision

### Research Flags

Phases with well-documented patterns (skip research-phase):
- **Phase 1:** All integration points are directly mapped from first-party source code (progressSync.js, schema.prisma, progress.js); no external research needed
- **Phase 2 — TrueFalseGame:** Identical interaction model to QuizGame; pattern is established; no research needed
- **Phase 2 — MemoryMatchGame:** MatchingGame.jsx is the direct reference; pattern is established; only architecture decision (extend vs new) needs a design review, not research

Phases needing a design review (not full research, but explicit decision):
- **Phase 2 — SortGame touch model:** The tap-to-place vs pointer-event drag decision has downstream consequences (whether `@dnd-kit` is installed in Phase 2 or deferred to Phase 3). Lock this decision before writing interaction code.
- **Phase 2 — MemoryMatchGame reuse:** Audit `MatchingGame.jsx` first and document the `pairType` prop extension plan or justification for a new component before writing any code.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from direct codebase inspection + confirmed npm registry versions. One MEDIUM item: React 19 + dnd-kit peer dep workaround is community-verified, not officially documented by dnd-kit maintainers. |
| Features | HIGH (codebase) / MEDIUM (UX patterns) | Table stakes derived from direct code inspection of existing game components. UX patterns (tap target sizes, flip-back timing, working memory caps) drawn from educational app UX research — credible consensus, not first-party studies. |
| Architecture | HIGH | All integration points directly inspected from source: progressSync.js, MiniGame.jsx, schema.prisma, progress.js, logic.js, MatchingGame.jsx. Zero inference. |
| Pitfalls | HIGH | Every critical pitfall traced to a specific line or mechanism in the live codebase. Not speculative. |

**Overall confidence: HIGH**

### Gaps to Address

- **dnd-kit React 19 peer dep:** Community consensus says `--legacy-peer-deps` works at runtime, but no official dnd-kit release note confirms React 19 support. If npm install fails or runtime errors appear, the fallback is pointer-event-based drag implementation (no library). Low probability issue.
- **MatchingGame extend vs new component decision:** Research documents both options but cannot make the final call without a closer audit of `MatchingGame`'s internal API surface. This must be resolved in Phase 2 planning before writing `MemoryMatchGame.jsx`.
- **Freemium gate intent:** Research confirms the `FREE_MODULE_SLUGS` gate exists and the logic module slug must not accidentally appear there. Whether the logic module is intended as free or premium is a product decision not resolvable by research.

---

## Sources

### Primary (HIGH confidence — first-party source code)
- `server/src/services/progressSync.js` — SCORE_FIELDS array, computeStars, SM-2, ModuleDifficulty
- `client/src/pages/MiniGame.jsx` — handleGameComplete routing block, score field mapping
- `server/prisma/schema.prisma` — LessonProgress score columns
- `server/src/routes/progress.js` — body destructuring (SEC-06 pattern), gameAccuracy, freemium gate
- `client/src/components/games/MatchingGame.jsx` — flip-card state machine reference
- `client/src/data/modules/logic.js` — current lesson shapes and mod.games array
- `client/src/components/games/QuizGame.jsx`, `PatternGame.jsx`, `OddOneOutGame.jsx` — established component patterns

### Secondary (MEDIUM confidence — verified external sources)
- npm registry: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2
- github.com/atlassian/react-beautiful-dnd — confirmed archived Aug 2025
- dndkit.com — touch sensor configuration, SortableContext API
- Community reports: React 19 + dnd-kit with `--legacy-peer-deps`

### Tertiary (MEDIUM confidence — UX research)
- Common Sense Media, Educational App Store — memory card difficulty structures (12/20/30 cards)
- Kokotree, COKOGAMES — true/false and size-sorting interaction patterns for kids
- MDN Web Docs — HTML5 DnD API touch incompatibility on iOS Safari

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
