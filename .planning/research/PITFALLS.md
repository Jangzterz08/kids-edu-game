# Pitfalls Research

**Domain:** Adding sort (drag-and-drop), trueFalse, and memoryMatch game types to an existing React kids edu app
**Researched:** 2026-03-22
**Confidence:** HIGH — based on direct codebase analysis of the live system

---

## Critical Pitfalls

### Pitfall 1: New Score Fields Not Registered in SCORE_FIELDS Causes Silent Star Miscalculation

**What goes wrong:**
`progressSync.js` defines `SCORE_FIELDS` as a hardcoded array:
```js
const SCORE_FIELDS = ['matchScore','traceScore','quizScore','spellingScore',
                      'phonicsScore','patternScore','oddOneOutScore','scrambleScore'];
```
`computeStars()` and all adaptive difficulty logic iterate over this array. If you add `sortScore`, `trueFalseScore`, or `memoryMatchScore` columns to the DB schema but forget to add them to `SCORE_FIELDS`, those scores are invisible to star computation — a kid who aces memoryMatch still gets 1 star, coins are under-awarded, and the SM-2 review scheduler never fires for those lessons.

**Why it happens:**
The array is the only wiring point, it's not derived from the schema, and schema migrations don't automatically update it. It's easy to remember to add DB columns but forget this second registration step.

**How to avoid:**
Add all three new score field names to `SCORE_FIELDS` in the same commit as the Prisma migration. Treat the array as a schema mirror — they must stay in sync. Add a test that checks `SCORE_FIELDS.length === number of score columns in LessonProgress`.

**Warning signs:**
- Lessons with new game types always complete at 1 star despite high scores
- `gameAccuracy` in `/api/progress/:kidId/stats` response never shows sort/trueFalse/memoryMatch keys
- No review schedule rows created for new-game-type lessons

**Phase to address:**
Phase 1 (DB migration + progressSync wiring) — must be verified before any game component is built.

---

### Pitfall 2: MiniGame.jsx Score Routing Left Incomplete

**What goes wrong:**
`handleGameComplete` in `MiniGame.jsx` routes each `gameType` string to a named score field:
```js
if (gameType === 'matching')  update.matchScore = score;
if (gameType === 'tracing')   update.traceScore = score;
// ...
```
If the three new game types (`sort`, `trueFalse`, `memoryMatch`) are not added to this block, `recordLesson` is called with none of the score fields set. The server receives an update with only `viewed: true` — the lesson is marked viewed but earns 1 star maximum regardless of performance, coins are wrong, and adaptive difficulty is never fed real data.

**Why it happens:**
This is a second manual wiring point in addition to `SCORE_FIELDS`. Developers often build the game component, verify it renders correctly, and ship — forgetting that the glue code in `MiniGame.jsx` also needs updating.

**How to avoid:**
Update `MiniGame.jsx` in the same PR as the game component, and add the new game badge labels in the `gameBadge` display block (currently the badge falls through to `'❓ Quiz'` for any unrecognised type).

**Warning signs:**
- New game completion increments play count but star count does not change appropriately
- `update` object logged to console shows no score field when new game finishes
- Analytics `gameAccuracy` shows `sort: null` after multiple plays

**Phase to address:**
Phase 1 (integration wiring) — before any UX work.

---

### Pitfall 3: Drag-and-Drop Breaks on Touch Devices Without Explicit Touch Handling

**What goes wrong:**
The HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDrop`) does not fire on iOS Safari or most Android browsers. A sort game built with native HTML5 drag will work on desktop Chrome but be completely non-interactive on the tablets and phones the children actually use.

**Why it happens:**
React's synthetic `onDrag*` events delegate to the HTML5 DnD API, which is designed for mouse input. iOS Safari explicitly excludes touch events from the DnD API. Developers test on desktop during development and miss this.

**How to avoid:**
Use pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) instead of drag events. Pointer events fire on both mouse and touch input and work across all target browsers. The sort game should track `pointerId`, capture the pointer with `element.setPointerCapture(e.pointerId)`, and compute drop targets by position. Alternatively, use tap-to-select + tap-to-place interaction (no drag at all) for ages 4–6 where fine motor precision is limited.

**Warning signs:**
- Sort game works in browser devtools mobile emulation but not on a real iPad
- `onDragStart` never fires during manual testing on a touch device
- No console errors — the event simply never triggers

**Phase to address:**
Phase 2 (sort game component) — decide pointer-events vs tap-to-place pattern before writing any interaction code.

---

### Pitfall 4: memoryMatch Is the Same Game as Existing MatchingGame — Duplicate Logic Diverges

**What goes wrong:**
The existing `MatchingGame.jsx` is already a memory card-flip game (flip two cards, find pairs, locked state, score formula). If `memoryMatch` is implemented as a new `MemoryMatchGame.jsx` written from scratch, you end up with two nearly identical components. They will diverge: bug fixes applied to one won't reach the other, styling inconsistencies appear, and the test surface doubles.

**Why it happens:**
The new game type has a different name and is conceptually "new" for the Logic module, so developers write a fresh component instead of parameterising the existing one.

**How to avoid:**
Audit `MatchingGame.jsx` before writing `MemoryMatchGame.jsx`. If the only difference is the content structure (logic lessons need emoji-to-emoji pairs vs word-to-image pairs), extend `MatchingGame` with a `pairType` prop rather than duplicating it. The existing `matchingPairs` field on lesson data already supports custom pair structures.

**Warning signs:**
- Two files with near-identical `handleFlip`, `locked`, `justMatched` state logic
- Same animation keyframe defined in two places
- A bug fix in one game doesn't get applied to the other

**Phase to address:**
Phase 2 (memoryMatch component) — decide reuse vs new before writing any code.

---

### Pitfall 5: Age-Adaptive Content With No ageGroup Guard Crashes on Null ageGroup

**What goes wrong:**
`KidProfile.ageGroup` is nullable (`String?` in schema). The `upsertProgress` service passes `kid.ageGroup` to `classifyAccuracy()` and `getHardThreshold()`. These functions receive `null` and should handle it, but any age-gating logic in the new lesson data (e.g., selecting 4–6 vs 6–8 lesson variants inside a game component) that does `if (kid.ageGroup === '4-6')` will silently fall to the else branch for kids with no ageGroup set — showing wrong difficulty content without any error.

**Why it happens:**
`ageGroup` is optional because it's set during onboarding which some parents skip. Game components written with `if/else` on ageGroup assume it's always set.

**How to avoid:**
Define a fallback: `const group = kid.ageGroup ?? '4-6'` at the top of any age-branching component. Treat missing ageGroup as the easier tier (4–6), which is the safer default for kids with unknown age. Document this convention in the component.

**Warning signs:**
- Kids with no ageGroup set see the 6–8 content (the else branch default) or no content at all
- A test kid created without ageGroup causes a game component to render nothing
- `trueFalse` statements reference reading skills for a 4-year-old

**Phase to address:**
Phase 3 (age-adaptive content data) and Phase 2 (all three game components) — wherever ageGroup is accessed.

---

### Pitfall 6: New Lessons Not Seeded in the DB Break the Server-Side Lesson Lookup

**What goes wrong:**
When a game finishes, `MiniGame.jsx` calls `recordLesson(lesson.slug, update)` for every lesson in the module. The server resolves slug → UUID via `prisma.lesson.findFirst({ where: { slug } })`. If the new logic module lessons (`logic-sun`, `sort-big-small`, etc.) exist in the static client JS data but are absent from the DB seed, every progress POST returns `404 Lesson not found: logic-sun`. The `.catch(() => {})` in `MiniGame.jsx` silently swallows this, so no scores are ever saved and the kid sees no coins/stars — without any visible error.

**Why it happens:**
The client and server have two separate content sources: static JS files on the client, and a DB seed on the server. Adding a lesson to `logic.js` does not automatically create a DB row. The silent `.catch` in `MiniGame.jsx` means the failure is invisible.

**How to avoid:**
Every lesson slug added to client data must have a corresponding DB seed row. Add a seed script or migration for all new lesson slugs. Consider adding a dev-mode validation: on app load in development, POST a list of known lesson slugs to a `/api/dev/validate-lessons` endpoint and log any missing ones.

**Warning signs:**
- Progress saves silently fail (no toast errors due to the `.catch(() => {})`)
- `lessons` table has no rows for slugs starting with `logic-`, `sort-`, `true-false-`, `memory-`
- Coins and stars never update after playing new game types

**Phase to address:**
Phase 1 (DB seed) — must be done before any integration testing.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding lesson variants per age group in static JS | Fast to ship, no backend changes | Can't A/B test content, hard to update without a deploy | Acceptable for v1.1 given static content approach is established |
| Tap-to-place instead of drag for sort game | Avoids pointer event complexity, works on all devices | Less "dragging" metaphor, slightly less engaging for 6–8 | Acceptable — motor skill mismatch anyway for 4–6 |
| Reusing `MatchingGame` for memoryMatch via prop | No new component file, fixes propagate | Increased complexity in MatchingGame, must test both modes | Acceptable if prop interface is clean |
| Skipping animation for trueFalse wrong answer | Faster to build | Kids get less feedback signal on errors | Never — age 4–6 needs strong visual feedback |
| Adding new score fields without a DB migration | One fewer deploy step | Server crashes on upsert with unknown field | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `SCORE_FIELDS` in progressSync.js | Add DB columns but not the array | Update both in same commit; treat array as a schema mirror |
| `MiniGame.jsx` handleGameComplete | Build game component, forget score routing block | Update gameType → scoreField mapping before integration test |
| Offline sync (`/api/progress/:kidId/sync`) | New score field names not included in offline entry objects | `upsertOfflineLesson` stores whatever is passed; ensure new fields are in the entry object written to localStorage |
| `stats` endpoint gameAccuracy object | New game types not added to the destructured select + response | Add `sortScore`, `trueFalseScore`, `memoryMatchScore` to the select query in `/api/progress/:kidId/stats` |
| `buildQuizOptions` | New logic lessons used in trueFalse but `buildQuizOptions` assumes `word`/`imageFile` structure | trueFalse lessons have `statement`/`answer` shape — don't call `buildQuizOptions` for them; write a `buildTrueFalseQuestion` helper |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| memoryMatch with 16+ cards re-rendering entire grid on each flip | Jank on low-end tablets during card flip | Wrap card render in `React.memo`; only `flipped`/`matched` state should trigger re-renders | Any tablet with <2GB RAM (common in primary schools) |
| Sort game calling `onPointerMove` on every pixel | 60fps handler doing layout reads (getBoundingClientRect) causes forced reflow | Throttle move handler with `requestAnimationFrame`; cache initial card positions on `onPointerDown` | Noticeable on Android mid-range devices at 4+ sort items |
| trueFalse reading TTS aloud on every render | Web Speech API queue fills up; statements get spoken multiple times | Guard `speakWord` calls with a `useEffect` that only fires when the question index changes (pattern already used in PatternGame and OddOneOutGame) | Immediately — if `speakWord` is called outside useEffect |
| Age-adaptive data selection on every render | Minor — negligible at current scale | Derive age-group variant once in `useMemo` | Not a real concern until 10k+ concurrent users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client-supplied `ageGroup` in game component to select content tier | A manipulated request could unlock harder content for a younger kid — low risk but inconsistent UX | `ageGroup` is read from `kid.ageGroup` in DB via `resolveWriteAccess`, not from client payload; enforce this |
| Including `sortScore`/`trueFalseScore`/`memoryMatchScore` in the body destructuring on the server but forgetting the SEC-06 pattern | Unknown fields passed to Prisma upsert could cause unexpected behavior | The server already destructures known fields only (SEC-06); new score fields must be explicitly added to the destructure block in `progress.js` line 224 |
| New module bypassing the freemium gate | Logic module accessible to free users when it should respect the free-3-modules rule | `FREE_MODULE_SLUGS` is the gate — the logic module slug must NOT be in that list unless explicitly intended as free tier |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Sort game drag targets too small on mobile | 4-year-olds with thick fingers cannot hit 40×40px targets | Minimum tap target 60×60px; use the same `minHeight: 80` + `borderRadius: 24` pattern from MatchingGame cards |
| trueFalse "True" and "False" buttons as text only | Pre-readers (4–6 age group) can't read the button labels | Use large emoji icons (✅/❌) alongside text; speak the statement aloud automatically via `speakWord` on question change |
| memoryMatch using 6 pairs (12 cards) for age 4–6 | Too many cards to hold in working memory; frustration and abandonment | Start with 3 pairs (6 cards) for age 4–6; 6 pairs (12 cards) for age 6–8 |
| No progress indicator during sort sequence | Kids don't know how many items remain | Show `currentIndex + 1 / total` badge, same pattern as PatternGame and OddOneOutGame |
| Sort game showing items in already-correct order | "Correct order" is trivially obvious; no challenge | Always shuffle items on mount; verify shuffle doesn't accidentally produce the correct order |
| Forgetting `speakerBtn` for question replay | Children mishear instructions and have no way to replay | Every game that speaks a question must include the 🔊 replay button (established pattern in PatternGame and OddOneOutGame) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Sort game on touch:** Tested on a real iOS device, not just Chrome devtools touch emulation — pointer events work and drag targets are reachable
- [ ] **Score persistence:** After completing a new game type, DB shows non-null `sortScore`/`trueFalseScore`/`memoryMatchScore` in `LessonProgress` rows
- [ ] **Star calculation:** Completing sort+trueFalse both at ≥80 awards 3 stars; completing one at <80 awards 2 — verified in the DB, not just the UI
- [ ] **Coins awarded:** Toast fires "+🪙 N coins!" after new game type completion
- [ ] **gameAccuracy stats:** Parent dashboard analytics show sort/trueFalse/memoryMatch accuracy entries (not `null`) after play
- [ ] **Age-adaptive content:** A kid with ageGroup '4-6' sees simpler trueFalse statements (image-based, no reading); a kid with '6-8' sees text statements
- [ ] **DB seed:** All new lesson slugs resolve successfully on the server — no silent 404s in server logs
- [ ] **Freemium gate:** Logic module is not inadvertently added to `FREE_MODULE_SLUGS` (or if it is, it's intentional and documented)
- [ ] **SCORE_FIELDS array:** `SCORE_FIELDS.length` in progressSync.js matches the number of `*Score` nullable columns in `LessonProgress`
- [ ] **Offline sync:** Score fields for new game types round-trip correctly through the offline localStorage → sync flow

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| SCORE_FIELDS missing new fields | MEDIUM | Add fields to array, deploy server, no data loss (scores were never written) |
| MiniGame.jsx routing missing | MEDIUM | Add mapping, deploy client; previously played sessions lost but no corruption |
| Drag-and-drop unusable on touch | HIGH | Rewrite sort game interaction model from DnD to pointer events; 1–2 days rework |
| DB seed missing | LOW | Write and run seed migration; existing progress rows unaffected |
| memoryMatch duplicated from MatchingGame | HIGH (delayed) | Gradual consolidation; divergence compounds over time making it harder |
| trueFalse no pre-reader support | MEDIUM | Add emoji icons + TTS; requires component rework not just data change |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SCORE_FIELDS not updated | Phase 1 — DB + server wiring | Server test: `SCORE_FIELDS` length === count of `*Score` columns |
| MiniGame.jsx routing gap | Phase 1 — integration wiring | Integration test: game completion writes named score field to DB |
| HTML5 drag breaks on touch | Phase 2 — sort game implementation | Manual test on real iOS device before PR merge |
| memoryMatch duplicated from MatchingGame | Phase 2 — memoryMatch planning | Design review: decision logged before writing component |
| ageGroup null fallback absent | Phase 2 + 3 — all game components + content | Test with kid profile where ageGroup is null; verify fallback to 4–6 tier |
| DB seed missing for new lessons | Phase 1 — DB seed | Server log check: zero 404s on lesson slug resolution during smoke test |
| trueFalse no pre-reader support | Phase 2 — trueFalse component | Test session with age 4–6 profile: TTS fires, emoji icons present |
| Freemium gate misconfigured | Phase 1 — content module registration | Assert `FREE_MODULE_SLUGS` does not include 'logic' unless deliberately decided |
| Stats endpoint not extended | Phase 1 — server wiring | API test: `/stats` response includes sort/trueFalse/memoryMatch accuracy keys |
| Offline sync fields missing | Phase 1 — localStorage wiring | Test: complete new game offline, lose connection, reconnect; verify scores sync |

---

## Sources

- Direct codebase analysis: `/server/src/services/progressSync.js` — SCORE_FIELDS array and computeStars logic
- Direct codebase analysis: `/client/src/pages/MiniGame.jsx` — handleGameComplete routing block
- Direct codebase analysis: `/server/prisma/schema.prisma` — LessonProgress score columns
- Direct codebase analysis: `/server/src/routes/progress.js` — body destructuring (SEC-06 pattern), freemium gate
- Direct codebase analysis: `/client/src/components/games/MatchingGame.jsx` — existing memoryMatch-like implementation
- Direct codebase analysis: `/client/src/data/modules/logic.js` — current logic module structure (uses `matching` + `pattern` + `oddOneOut`, not new game types yet)
- Direct codebase analysis: `/client/vercel.json` — CSP headers (no drag-event-specific restrictions found)
- MDN Web Docs: HTML Drag and Drop API browser compatibility — iOS Safari does not support HTML5 DnD
- React docs: Pointer Events vs Mouse/Touch Events for cross-device interaction

---
*Pitfalls research for: KidsLearn v1.1 — sort, trueFalse, memoryMatch integration*
*Researched: 2026-03-22*
