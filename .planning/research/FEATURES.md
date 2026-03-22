# Feature Research

**Domain:** Kids educational game — new game types (sort, trueFalse, memoryMatch) for Logic & Reasoning module
**Researched:** 2026-03-22
**Confidence:** HIGH (codebase analysis) / MEDIUM (UX patterns from web research)

---

## Context: What Already Exists

This is a subsequent milestone. Existing codebase ships:

- `MatchingGame.jsx` — flip-to-reveal card pairs (image+word), deployed
- `PatternGame.jsx` — sequence completion with emoji options
- `OddOneOutGame.jsx` — tap the different item from a 2x2 grid
- `LessonProgress` Prisma model with per-game score columns: `matchScore`, `traceScore`, `quizScore`, `spellingScore`, `phonicsScore`, `patternScore`, `oddOneOutScore`, `scrambleScore`
- `MiniGame.jsx` dispatches to game components by `gameType` string from `mod.games[]`
- `logic.js` already has `games: ['matching', 'pattern', 'oddOneOut']` — needs extension

All new game types follow the same contract: receive `lessons` (and/or module) prop, call `onComplete(score: 0-100)` when done.

---

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| sort: tap-to-select + tap-to-place | Touch drag is unreliable for ages 4-6 (motor skills). Tap-to-select then tap-slot is the safe primary interaction | MEDIUM | Primary: select item (highlight) → tap slot to place. Drag as v1.1.x enhancement. |
| sort: visually obvious size difference | Sorting "big to small" must need zero reading. Emoji character size alone is not enough | MEDIUM | Use `renderSize` CSS value per item. Items must differ by at least 24px in rendered size. |
| sort: correct/wrong feedback | Immediate green on correct arrangement; shake on wrong placement | LOW | `shake` and `match-bounce` keyframes already in global CSS. `speakWord('Great job!')` exists. |
| trueFalse: audio for every claim | Ages 4-6 cannot read. Every claim must auto-speak on load + have a speaker replay button | LOW | `speakWord()` exists. Pattern established in `PatternGame.jsx`. |
| trueFalse: large True/False targets | Two giant buttons — unmistakably green "True" / red "False". Small targets = frustration exits | LOW | Min 100px height. Match existing `kid-btn` sizing conventions. |
| trueFalse: emoji visual claim | Pre-readers need a visual representation of the claim, not text. Emoji array communicates the concept. | MEDIUM | Lesson data needs `claimEmojis: string[]` + `claimText: string` (for audio) + `answer: boolean`. |
| memoryMatch: CSS flip animation | Kids expect visual card-turn. Flat color swap feels broken for this mechanic. | LOW | `rotateY(180deg)` with `backface-visibility: hidden` on front + back faces. Tap-triggered (not hover). |
| memoryMatch: face-down back | Cards show "?" back so kids know they are hidden | LOW | Already done in `MatchingGame`. Reuse pattern. |
| memoryMatch: matched pairs stay face-up | Once matched, cards lock green and stay revealed | LOW | Already implemented in `MatchingGame`. Port the pattern. |
| memoryMatch: flip-back timeout | Unmatched pair flips back after ~900ms. Not instant — child needs moment to see what they chose | LOW | Already in `MatchingGame` at 900ms. Reuse. |
| memoryMatch: emoji-only pairs | Existing `MatchingGame` pairs emoji+word (needs reading). `memoryMatch` should be emoji-to-emoji for pre-readers | LOW | Simpler: pairs of `{ pairId, emoji }`. No reading required. Differentiates from `MatchingGame`. |
| score 0-100 on completion | All game types call `onComplete(score)` — feeds starsEarned, ModuleDifficulty, spaced-repetition | LOW | Consistent formula: mistakes deduct from 100. Matches existing `PatternGame`/`OddOneOutGame` pattern. |
| progress indicator | Current round / total rounds visible | LOW | All existing games show `{current} / {total}` badge. Required. |
| DB score columns | `LessonProgress` needs `sortScore`, `trueFalseScore`, `memoryMatchScore` | LOW | Prisma migration required. `MiniGame.jsx` score dispatch must be wired. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| sort: drag enhancement via dnd-kit | Ages 6-8 prefer drag; dnd-kit is touch-native (HTML5 Drag API has zero touch support) | MEDIUM | `@dnd-kit/core` ~10kB. Add as enhancement after tap-select core works. Only if sort completion rate shows friction. |
| sort: 3 attribute types (size/count/sequence) | One game type reusable across future modules — sizes, dot counts, ordered sequences | MEDIUM | `sortAttribute: 'size' | 'count' | 'sequence'` on lesson. MVP: size only. Count reuses `DotGrid` component. |
| trueFalse: age-adaptive content | 4-6 gets emoji+audio only; 6-8 gets short sentence+audio. Lesson data carries `ageGroup` field. | MEDIUM | Requires `kid.ageGroup` surfaced in `KidContext`. Already in `KidProfile` DB. Filter in component. |
| memoryMatch: age-adaptive card count | 6 pairs for 4-6 (12 cards); 8 pairs for 6-8 (16 cards). More cards = harder memory load. | LOW | Requires `kid.ageGroup` in context. Low effort once trueFalse age-adaptation is done. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Drag-only sort (no tap fallback) | Drag feels intuitive in desktop demos | HTML5 Drag API has zero touch support. Ages 4-6 have imprecise motor control — missed drags cause abandonment | Always implement tap-to-select + tap-to-place as primary. Drag via dnd-kit as enhancement. |
| Text-only trueFalse for ages 4-6 | Simpler to author as sentences | Pre-readers cannot read. Text-only makes the game inaccessible for half the target audience | Require emoji+audio for 4-6. Short sentence+audio for 6-8. |
| Countdown timer in any new game type | Creates urgency, feels game-like | Induces anxiety in ages 4-6. Reduces learning retention. Frustration exits increase. | Mistake-count scoring (deduct from 100 per error). No time pressure. |
| memoryMatch with word-pair matching | Seems like a natural extension | `MatchingGame` already does this. Duplicate mechanic confuses content authors and dilutes both games. | `memoryMatch` = emoji-only pairs. Word matching stays in `MatchingGame`. |
| Sort with more than 5 items | More items = more content | Working memory ages 4-6 is 2-3 items. Ages 6-8 handle 4-5. More than 5 guarantees confusion. | Cap at 3 items for MVP (all ages). Extend to 5 max for 6-8 in v1.1.x. |
| Full 3D perspective flip with depth | Looks impressive | `perspective` + `preserve-3d` causes paint jank on mid-range Android. iOS Safari has `backface-visibility` bugs in scroll context. | Flat `rotateY(180deg)` with `backface-visibility: hidden`. No `perspective` depth needed. Still looks like a flip. |

---

## Feature Dependencies

```
[sort game type]
    └──requires──> [lesson data: sortAttribute + items[] with correctOrder + renderSize]
    └──requires──> [DB: sortScore column in LessonProgress]
    └──requires──> [MiniGame.jsx: sort dispatch branch]
    └──enhances──> [DotGrid component: for count-based sort (future)]

[trueFalse game type]
    └──requires──> [lesson data: claimEmojis + claimText + answer]
    └──requires──> [DB: trueFalseScore column in LessonProgress]
    └──requires──> [MiniGame.jsx: trueFalse dispatch branch]
    └──requires──> [speakWord(): auto-speak on load — already exists]
    └──enhances──> [KidProfile.ageGroup: for age-adaptive content in v1.1.x]

[memoryMatch game type]
    └──requires──> [module data: memoryMatchPairs[] with pairId + emoji]
    └──requires──> [DB: memoryMatchScore column in LessonProgress]
    └──requires──> [MiniGame.jsx: memoryMatch dispatch branch]
    └──enhances──> [KidProfile.ageGroup: for adaptive pair count in v1.1.x]

[sort drag enhancement]
    └──requires──> [@dnd-kit/core: new npm dependency]
    └──requires──> [sort game type: tap-select core must exist first]

[age-adaptive content/card-count]
    └──requires──> [KidProfile.ageGroup: in DB, must be in KidContext]
    └──requires──> [respective game type: core version must ship first]
```

### Key Dependency Notes

- **DB migration must be first:** `sortScore`, `trueFalseScore`, `memoryMatchScore` columns in `LessonProgress` before `MiniGame.jsx` score wiring can deploy. One Prisma migration covers all three.
- **memoryMatch reads from module, not lessons:** Use `mod.memoryMatchPairs[]` not `lessons[]`. Add field to `logicModule` in `logic.js`. Game receives `mod` prop OR `lessons` is ignored and pairs come from a separate prop.
- **trueFalse lesson filtering by ageGroup (v1.1.x):** Filter inside component using `kid.ageGroup` from `KidContext`. No new API call needed — `KidProfile.ageGroup` already stored.
- **No new routing needed:** `MiniGame.jsx` already handles all dispatch by `gameType` string. Adding three `if` branches is the full integration surface.

---

## MVP Definition

### Launch With (v1.1.0)

- [ ] **SortGame component** — tap-to-select + tap-to-place. Size attribute only. 3 items. Score = 100 - (misplacements * 20). Call `onComplete(score)`.
- [ ] **TrueFalseGame component** — emoji array + audio claim. Auto-speak on load. Replay button. True/False tap targets. Score = (correct / total) * 100.
- [ ] **MemoryMatchGame component** — emoji-only pairs. 6 pairs (12 cards). CSS flip animation. 900ms flip-back on mismatch. Score = max(0, 100 - extra_attempts * 8).
- [ ] **DB migration** — `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` on `LessonProgress`.
- [ ] **MiniGame.jsx wiring** — dispatch branches for `sort`, `trueFalse`, `memoryMatch`.
- [ ] **logic.js content** — sort lessons (3-4 rounds), trueFalse lessons (6-8 claims), memoryMatchPairs (6 emoji pairs). Update `mod.games` array.

### Add After Validation (v1.1.x)

- [ ] **sort: drag enhancement** — `@dnd-kit/core` with touch sensors. Only if sort completion rate shows friction signal.
- [ ] **trueFalse: age-adaptive content** — split lesson data by `ageGroup`. Filter in component by `kid.ageGroup`.
- [ ] **memoryMatch: age-adaptive card count** — 6 pairs for 4-6, 8 pairs for 6-8.
- [ ] **sort: count + sequence attributes** — extend lesson data. Reuse `DotGrid` for count.

### Future Consideration (v2+)

- [ ] **memoryMatch: progressive peek hint** — after 3 misses on same pair, briefly reveal that pair. High complexity.
- [ ] **trueFalse: image-based claims** — requires image assets for logic module (currently emoji-only).

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| sort — tap-to-place core | HIGH | LOW | P1 |
| trueFalse — emoji+audio core | HIGH | LOW | P1 |
| memoryMatch — emoji pairs core | HIGH | LOW | P1 |
| DB migration (3 score columns) | HIGH | LOW | P1 |
| MiniGame.jsx wiring | HIGH | LOW | P1 |
| logic.js lesson content | HIGH | LOW | P1 |
| age-adaptive trueFalse content | MEDIUM | MEDIUM | P2 |
| age-adaptive memoryMatch card count | MEDIUM | LOW | P2 |
| sort — drag via dnd-kit | MEDIUM | MEDIUM | P2 |
| sort — count + sequence attributes | MEDIUM | MEDIUM | P2 |
| memoryMatch — peek hint | LOW | HIGH | P3 |

---

## Required Data Structures

### sort lesson shape

```js
{
  slug: 'sort-size-animals',
  word: 'Big to Small',
  emoji: '📏',
  gameType: 'sort',
  prompt: 'Put in order: biggest first!',
  sortAttribute: 'size',
  items: [
    { id: 'elephant', emoji: '🐘', label: 'Elephant', correctOrder: 1, renderSize: 80 },
    { id: 'dog',      emoji: '🐶', label: 'Dog',      correctOrder: 2, renderSize: 52 },
    { id: 'ant',      emoji: '🐜', label: 'Ant',      correctOrder: 3, renderSize: 28 },
  ],
}
```

`renderSize` drives the CSS pixel size rendered — without this, emoji characters look similar in size across items.

### trueFalse lesson shape

```js
{
  slug: 'tf-dogs-bark',
  word: 'Dogs make sounds',
  emoji: '🐶',
  gameType: 'trueFalse',
  claimEmojis: ['🐶', '🔊'],
  claimText: 'Dogs make sounds',
  answer: true,
}
```

### memoryMatch pairs (module-level field, not per-lesson)

```js
// Added to logicModule object in logic.js:
memoryMatchPairs: [
  { pairId: 'sun',    emoji: '☀️' },
  { pairId: 'moon',   emoji: '🌙' },
  { pairId: 'star',   emoji: '⭐' },
  { pairId: 'heart',  emoji: '❤️' },
  { pairId: 'flower', emoji: '🌸' },
  { pairId: 'apple',  emoji: '🍎' },
]
```

`MemoryMatchGame` receives `mod` prop (not `lessons`) and reads `mod.memoryMatchPairs`.

---

## Sources

- Codebase: `MatchingGame.jsx`, `PatternGame.jsx`, `OddOneOutGame.jsx`, `MiniGame.jsx`, `logic.js`, `schema.prisma`
- [Designing for Kids: UX Design Tips for Children Apps](https://www.ungrammary.com/post/designing-for-kids-ux-design-tips-for-children-apps)
- [Preschool Memory Match — Common Sense Media](https://www.commonsensemedia.org/app-reviews/preschool-memory-match) — 12/20/30 card difficulty structure
- [8 Memory Games for Kids — Educational App Store](https://www.educationalappstore.com/best-apps/memory-games-for-kids)
- [dnd-kit overview](https://dndkit.com/) — touch support, WCAG 2.1 AA, ~10kB core
- [Top 5 Drag-and-Drop Libraries for React in 2026 — Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [401 True or False Questions for Kids — Kokotree](https://kokotree.com/blog/games-activities/true-false-questions-kids)
- [SIZE SORTING Game — COKOGAMES](https://www.cokogames.com/size-sorting/)

---

*Feature research for: KidsLearn v1.1 — Logic & Reasoning (sort, trueFalse, memoryMatch)*
*Researched: 2026-03-22*
