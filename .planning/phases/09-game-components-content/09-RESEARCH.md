# Phase 9: Game Components & Content - Research

**Researched:** 2026-03-23
**Domain:** React game components (CSS 3D flip, tap-to-place touch, TrueFalse feedback), lesson content data authoring, age-group filtering, freemium gate
**Confidence:** HIGH

## Summary

Phase 9 is a pure frontend phase. All backend infrastructure (DB columns, SCORE_FIELDS, MiniGame dispatch) was wired in Phase 8. Phase 9 delivers three new React game components and the expanded Logic module lesson data. No new libraries are required — every pattern has a direct precedent in the existing codebase.

The three components follow an identical prop contract: `{ lessons, onComplete(score: 0-100) }`. All state management is local `useState`. Scores report via `onComplete` and MiniGame.jsx handles persistence — the game components are unaware of backend concerns. Styles use CSS-in-JS with `var(--token)` references (no Tailwind, no CSS modules), matching every other game in the codebase.

The most technically novel aspect is SortGame's tap-to-select-then-tap-to-place interaction pattern (no HTML5 drag API, which has zero iOS touch support) and MemoryMatchGame's CSS 3D card flip (`perspective` + `rotateY(180deg)` + `backface-visibility: hidden`). Both are entirely achievable with vanilla React and inline styles. The Logic module lesson data requires expanding `logic.js` with 18 new lessons that include an `ageGroup` field, and the module page must filter by `kid.ageGroup` before passing to MiniGame.

**Primary recommendation:** Build in order — TrueFalseGame (simplest, validates the end-to-end flow), MemoryMatchGame (CSS-only complexity), SortGame (touch handling requires the most care). Each component can be smoke-tested in isolation by rendering it in MiniGame with the Logic module.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Total new lessons:** 18 (3 per game type x 2 age groups x 3 lessons each). Combined with existing 14 logic lessons = 32 total.

**TrueFalse content (ages 4-6):**
- Mix of visual property claims and category membership claims
- Emoji-only — no text. Claims spoken aloud via `speakWord()`
- Examples: "Is apple red?" (property), "Is cat an animal?" (category)
- Score: 100 (correct) or 0 (incorrect) — binary

**TrueFalse content (ages 6-8):**
- Factual knowledge claims — text-based, spoken aloud
- Examples: "The sun is a star" (true), "Fish can fly" (false)
- Real-world knowledge kids this age should know

**Sort content (both age groups):**
- Size ordering — "Put these from smallest to biggest"
- Items have explicit `renderSize` pixel values for visual size distinction
- 4-6: 3 items per lesson (simpler). 6-8: 4-5 items (more challenge)

**MemoryMatch content:**
- Emoji-to-emoji pairs — no text labels (pre-reader safe)
- 6 pairs per lesson (12 cards total, 4x3 grid)
- Content: familiar emoji pairs (animals, food, nature)

**Age group field:** Every new lesson includes `ageGroup: '4-6'` or `ageGroup: '6-8'`. Module page filters lessons by `kid.ageGroup` before passing to MiniGame.

**MemoryMatch Architecture:** New MemoryMatchGame.jsx component — NOT extending MatchingGame.jsx.

**Scoring:**
- TrueFalse: 100 (correct) or 0 (incorrect) — binary
- MemoryMatch: `100 - extra_attempts * 8`, floored at 0 (same formula as MatchingGame)
- Sort: percentage of items in correct position

**Feedback patterns:**
- TrueFalse: Correct = green + checkmark; Wrong = shake + red, correct answer highlighted green
- Sort: Reveal at end only — kid places all items, taps "Check" button; correct glow green, wrong shake red
- MemoryMatch: Match = green + bounce; Mismatch = flip back after 900ms

**Auto-advance:** All 3 games show brief results for ~1.5s, then auto-advance. Games call `onComplete(score)` after delay. MiniGame.jsx handles the sequence.

**Sound:** No sound effects. `speakWord()` used for TrueFalse claim audio and replay button only.

### Claude's Discretion

- MemoryMatch card back design ("?" like MatchingGame, brain emoji, or something else)
- Exact celebration animation for brief results display
- Sort "Check" button styling and placement
- TrueFalse button layout (side-by-side vs stacked)
- Specific emoji choices for lesson content (within the decided themes)
- Whether to extract shared utilities from MatchingGame (shuffle, scoring) into a common helper

### Deferred Ideas (OUT OF SCOPE)

- Drag-and-drop sort via `@dnd-kit/core` — tap-to-place is the v1.1 interaction
- Dynamic difficulty scaling — static age-group filter only
- Sound effects (correct/wrong chimes) — audio system deferred
- Ollie mascot reactions in games — visual color feedback is sufficient
- Additional logic modules (sequences, balance puzzles) — EXP-01 in v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | Logic module has 6+ lessons (3 per age group), covering sort, trueFalse, memoryMatch game types | `logic.js` already has 14 lessons; 18 new ones with `ageGroup` field extend it to 32 total |
| CONT-02 | Logic module in registry + behind freemium gate (premium) | `data/index.js` already imports `logicModule`; `KidHome.jsx` `FREE_MODULE_SLUGS = ['alphabet','numbers','shapes']` — logic is already locked |
| CONT-03 | Each logic lesson has `ageGroup` field; module page filters by `kid.ageGroup` before passing to MiniGame | `ageGroup` is in Prisma schema and returned by `auth.js` in JWT payload; filter must be added to the page that invokes MiniGame |
| GAME-01 | TrueFalseGame component — emoji claim auto-spoken on mount, replay button, True/False tap, visual feedback, `onComplete(score)` | `speakWord()` from `lib/sound.js` confirmed; CSS animation tokens `shake`, `--btn-green-base`, `--accent-red` confirmed in `index.css` |
| GAME-02 | SortGame component — tap-to-select then tap-to-place; pointer events not HTML5 drag; `renderSize` values; `onComplete(score)` | TracingGame.jsx shows touch handling pattern; `touchAction: 'none'` on canvas; pointer events via `onClick` on `<button>` elements works on iOS |
| GAME-03 | MemoryMatchGame component — emoji pairs, CSS 3D flip, no text, match/mismatch feedback, `onComplete(score)` | MatchingGame.jsx has card state management pattern; CSS 3D (`perspective`, `rotateY`, `backface-visibility`) must be added — not yet in codebase |
| INTG-01 | All 3 components follow `{ lessons, onComplete(score: 0-100) }` prop contract; scores flow through existing systems | MiniGame.jsx dispatch for `sort`, `trueFalse`, `memoryMatch` already wired in Phase 8; no backend changes needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (already installed) | Component rendering, useState/useMemo | Already in use throughout |
| Web Speech API | Browser native | `speakWord()` TTS for TrueFalse claims | Already used via `lib/sound.js` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | No new installs needed |

**Installation:**
```bash
# No new packages. Phase 9 is pure React components + data.
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS-in-JS `styles` object | Tailwind classes | Project uses CSS-in-JS exclusively — Tailwind would be inconsistent |
| Tap-to-place (two-click) | HTML5 drag / @dnd-kit | HTML5 drag = zero iOS touch support; dnd-kit adds install complexity; deferred to v2 |
| New MemoryMatchGame component | Extending MatchingGame with pairType prop | MatchingGame has 165 lines of image/word/dots logic irrelevant to emoji-pair flip game; new component is simpler |

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── components/games/
│   ├── TrueFalseGame.jsx     # NEW — binary claim game
│   ├── MemoryMatchGame.jsx   # NEW — CSS 3D flip card pairs
│   ├── SortGame.jsx          # NEW — tap-to-place ordering
│   └── MatchingGame.jsx      # existing (reference)
├── data/modules/
│   └── logic.js              # MODIFIED — add 18 lessons + ageGroup
└── pages/
    └── MiniGame.jsx          # MODIFIED — import + render 3 new components, age-filter lessons
```

### Pattern 1: Game Component Shape
**What:** Every game component is a default export with destructured `{ lessons, onComplete }` props. All UI state is local `useState`. Score reported with `setTimeout(() => onComplete(score), 700)`.
**When to use:** All new game components follow this shape — no exceptions.
**Example:**
```jsx
// Source: client/src/components/games/MatchingGame.jsx lines 14-16
export default function MatchingGame({ lessons, onComplete }) {
  // local state only
  // setTimeout(() => onComplete(score), 700) at completion
}
```

### Pattern 2: CSS-in-JS styles object with design tokens
**What:** Styles object at the bottom of the file. All colors use `var(--token)` references, not hardcoded hex. Conditional styles via spread: `style={{ ...styles.card, ...(isActive ? styles.active : {}) }}`.
**When to use:** Every game component.
**Example:**
```jsx
// Source: client/src/components/games/MatchingGame.jsx lines 134-164
const styles = {
  card: {
    background: 'var(--btn-blue-base)',
    boxShadow: '0 8px 0 var(--btn-blue-shade)',
  },
  cardMatched: {
    background: 'var(--btn-green-base)',
    boxShadow: '0 0 24px rgba(16,185,129,0.5)',
  },
};
```

### Pattern 3: CSS 3D card flip (MemoryMatchGame)
**What:** A two-layer approach — outer container has `perspective`, inner element has `transformStyle: 'preserve-3d'` and toggles `rotateY(180deg)`. Front face is default, back face has `backface-visibility: hidden` and starts at `rotateY(180deg)`.
**When to use:** MemoryMatchGame cards only (no precedent in codebase — must be added fresh).
**Example:**
```jsx
// CSS-in-JS inline style pattern for 3D flip
const cardInner = {
  position: 'relative',
  width: '100%',
  height: '100%',
  transformStyle: 'preserve-3d',
  transition: 'transform 0.4s ease',
};
const cardFront = {
  position: 'absolute', width: '100%', height: '100%',
  backfaceVisibility: 'hidden',    // camelCase for inline styles
  WebkitBackfaceVisibility: 'hidden',
};
const cardBack = {
  ...cardFront,
  transform: 'rotateY(180deg)',
};
// Flip: apply transform: 'rotateY(180deg)' to cardInner when isFlipped
```

### Pattern 4: Tap-to-place interaction (SortGame)
**What:** Two-phase tap. Phase 1: tap an item to "select" it (sets `selected` state). Phase 2: tap an empty slot (or another item) to "place" the selected item there. No HTML5 drag, no onDrag events — only `onClick` on `<button>` elements.
**When to use:** SortGame only. Requires `touchAction: 'none'` on the container to prevent scroll interference.
**Why not HTML5 drag:** `ondragstart`/`ondrop` require `draggable` attribute which doesn't fire on iOS Safari touch events without a workaround library.
**Example pattern:**
```jsx
// Two-state machine: selectedIdx or null
const [selectedIdx, setSelectedIdx] = useState(null);
const [order, setOrder] = useState([...items]);

function handleItemTap(idx) {
  if (selectedIdx === null) {
    setSelectedIdx(idx);  // Phase 1: select
  } else {
    // Phase 2: swap selected with tapped slot
    const newOrder = [...order];
    [newOrder[selectedIdx], newOrder[idx]] = [newOrder[idx], newOrder[selectedIdx]];
    setOrder(newOrder);
    setSelectedIdx(null);
  }
}
```

### Pattern 5: Age-group lesson filtering in MiniGame
**What:** Before passing `mod.lessons` to a game component, filter by `kid.ageGroup`. The `activeKid` object from `useKid()` contains `ageGroup` (confirmed in KidContext + auth.js returns it in JWT payload).
**When to use:** Must be applied in MiniGame.jsx when module is `logic` (and any future age-filtered module).
**Implementation:**
```jsx
// In MiniGame.jsx — filter lessons for age-appropriate content
const lessons = mod.ageFiltered
  ? mod.lessons.filter(l => !l.ageGroup || l.ageGroup === activeKid?.ageGroup)
  : mod.lessons;
// Then pass `lessons` to game components instead of `mod.lessons`
```
Note: `ageGroup` on the lesson data uses `'4-6'` and `'6-8'`. The kid profile in the DB stores `ageGroup` as a nullable String (confirmed in `schema.prisma` line 64). AddKidModal uses `'5-6'` as default — verify which values are canonical when authoring lesson content. Safest: use `'4-6'` and `'6-8'` to match CONTEXT.md spec.

### Pattern 6: speakWord for TrueFalse claims
**What:** `speakWord(text)` in `lib/sound.js` tries a pre-cached audio file first, falls back to Web Speech API TTS. For emoji-only claims (ages 4-6), the "claim" text to speak is the question itself as a string (e.g., "Is this red?").
**When to use:** TrueFalseGame — called on mount (`useEffect` with empty deps) to auto-speak the claim, and in a replay button's `onClick`.
**Example:**
```jsx
import { speakWord } from '../../lib/sound';
// On mount:
useEffect(() => { speakWord(currentLesson.claim); }, [currentLesson]);
// Replay button:
<button onClick={() => speakWord(currentLesson.claim)}>🔊</button>
```

### Pattern 7: Existing keyframe animations (use by name)
**What:** Global keyframe animations defined in `client/src/index.css`. Reference them by name in inline style `animation` property.
**Available animations for Phase 9:**
```
shake         — translateX wiggle (wrong answer feedback)
match-bounce  — scale bounce (matched card celebration)
pop-correct   — scale + float up (correct answer sparkle)
slide-up      — fadeIn from below (results display)
wiggle        — rotation wiggle (generic celebration)
```
**Example:**
```jsx
// Wrong answer — shake the button
style={{ animation: isWrong ? 'shake 0.5s ease' : 'none' }}
// Matched card — bounce
style={{ animation: isJustMatched ? 'match-bounce 0.55s ease' : 'none' }}
```

### Anti-Patterns to Avoid
- **Using HTML5 drag API for SortGame:** `draggable` attribute + `ondragstart`/`ondrop` has no iOS touch support. Use `onClick`-based tap-to-place.
- **Extending MatchingGame with conditional logic:** MatchingGame has image/word/dots rendering that MemoryMatch doesn't need. A clean new component is simpler.
- **Hardcoding hex colors:** Use `var(--btn-green-base)`, `var(--accent-red)`, `var(--glass-bg)` etc. to stay consistent with the ocean theme.
- **Calling `recordLesson` from game components:** Game components only call `onComplete(score)`. MiniGame.jsx calls `recordLesson`. Games must remain unaware of backend.
- **Passing all lessons to age-filtered games without filtering:** Without the `kid.ageGroup` filter, a 4-year-old sees text-heavy 6-8 content. Filter in MiniGame, not inside game components.
- **Missing the `gameType` field on new logic lessons:** New lessons must declare `gameType: 'trueFalse'` / `'sort'` / `'memoryMatch'` so MiniGame can route them. Existing pattern lessons use `gameType: 'pattern'` — follow the same convention.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card shuffle | Custom random sort | `shuffle()` from MatchingGame.jsx (copy or extract) | Fisher-Yates is already implemented correctly; naive `sort(() => Math.random()-0.5)` is biased |
| Score formula | Custom weighting | `Math.max(0, 100 - extra * 8)` from MatchingGame | Consistent formula across all games; already validated |
| Text-to-speech | Custom audio component | `speakWord()` from `lib/sound.js` | Handles Chrome bug (must defer after cancel), voice preferences, pre-cached audio file fallback |
| Touch events on iOS | Raw `onTouchStart`/`onTouchMove` | `onClick` on `<button>` with `touchAction: 'none'` on container | `onClick` fires on both mouse and touch; simpler and more reliable for tap interactions |
| CSS animations | JavaScript animation timers | Global keyframes in `index.css` | `shake`, `match-bounce` already defined; just reference by name |

**Key insight:** The codebase has solved every hard problem already. Phase 9 is assembly, not invention.

## Common Pitfalls

### Pitfall 1: CSS 3D flip — backface-visibility camelCase
**What goes wrong:** CSS property `backface-visibility` becomes `backfaceVisibility` in React inline styles, but some developers also need `WebkitBackfaceVisibility` for Safari.
**Why it happens:** React camelCases all CSS properties; Safari (especially older iOS Safari) requires the `-webkit-` prefix for backface-visibility.
**How to avoid:** Always set both `backfaceVisibility: 'hidden'` and `WebkitBackfaceVisibility: 'hidden'` on card faces. The `WebkitBackdropFilter` pattern in MatchingGame.jsx confirms this project already handles vendor prefixes this way.
**Warning signs:** Cards show both faces simultaneously on iOS devices during flip animation.

### Pitfall 2: SortGame — scroll hijacking on mobile
**What goes wrong:** Touch-dragging items on a scrollable page causes page scroll instead of item interaction.
**Why it happens:** Default browser behavior intercepts touch events for scrolling before `onClick` fires.
**How to avoid:** Add `touchAction: 'none'` on the SortGame container div (same as TracingGame canvas at line 213). This prevents scroll interference within the game area.
**Warning signs:** Game items not responding to touch on iOS/Android; page scrolling instead.

### Pitfall 3: ageGroup value mismatch
**What goes wrong:** Kid profile stores `'5-6'` (AddKidModal default) but lesson data uses `'4-6'`. Kid sees no lessons.
**Why it happens:** AddKidModal uses `'5-6'` as initial state (line 8 of AddKidModal.jsx). CONTEXT.md specifies `'4-6'` and `'6-8'` as the ageGroup values.
**How to avoid:** The filter in MiniGame should use a range check or a mapping, OR AddKidModal values should be changed to match lesson data. The safest approach: filter `l.ageGroup === activeKid?.ageGroup || !l.ageGroup` and ensure AddKidModal options match the two canonical values (`'4-6'`, `'6-8'`).
**Warning signs:** Age-appropriate lessons not appearing for test kids.

### Pitfall 4: MemoryMatch flip state — locked during evaluation
**What goes wrong:** Kid taps a third card while two mismatched cards are being held for 900ms flip-back. Third tap is registered, causing state corruption (3 flipped cards).
**Why it happens:** State update batching + async setTimeout creates a window where a new tap registers before the flip-back clears.
**How to avoid:** Use a `locked` boolean state (same as MatchingGame line 37). Set `locked = true` when two cards are flipped, set `locked = false` in the `setTimeout` callback. `handleFlip` returns early if `locked`.
**Warning signs:** More than 2 cards showing face-up simultaneously; match detection behaving oddly.

### Pitfall 5: ModuleIntro pill labels missing new game types
**What goes wrong:** ModuleIntro.jsx renders game type pills but only has labels for `matching`, `tracing`, `spelling`, `phonics`. New game types show "❓ Quiz" fallback.
**Why it happens:** ModuleIntro.jsx (lines 19-25) has a hard-coded `if` chain with no fallback for new types.
**How to avoid:** Add `if (g === 'sort') label = '🔢 Sort'` etc. to ModuleIntro.jsx. MiniGame.jsx already has the correct labels (added in Phase 8); ModuleIntro must match.
**Warning signs:** Logic module intro page shows "❓ Quiz" for sort/trueFalse/memoryMatch game pills.

### Pitfall 6: Freemium gate — logic module already locked but verify
**What goes wrong:** Assuming the logic module is already correctly gated without checking.
**Why it happens:** `FREE_MODULE_SLUGS` in KidHome.jsx is `['alphabet', 'numbers', 'shapes']` (confirmed). Logic module slug is `'logic'` — not in the free list, so it is already locked. No change needed.
**How to avoid:** CONT-02 only requires confirming this — no code change to freemium gate is needed. The `isLocked` check (line 194 of KidHome.jsx) already handles it.
**Warning signs:** Logic module appearing unlocked for non-premium kids.

## Code Examples

Verified patterns from the existing codebase:

### TrueFalseGame lesson data shape
```js
// New lesson shape for logic.js
{
  slug: 'tf-red-apple-46',
  word: 'Red Apple',
  emoji: '🍎',
  gameType: 'trueFalse',
  ageGroup: '4-6',
  claim: 'Is this red?',          // spoken via speakWord()
  claimEmoji: '🍎',               // displayed (no text for 4-6)
  correct: true,                  // true = "True" is right answer
}
```

### SortGame lesson data shape
```js
{
  slug: 'sort-size-animals-46',
  word: 'Animal Size',
  emoji: '🐘',
  gameType: 'sort',
  ageGroup: '4-6',
  prompt: 'Smallest to biggest!',
  items: [
    { emoji: '🐜', label: 'Ant',      renderSize: 24  },
    { emoji: '🐱', label: 'Cat',      renderSize: 48  },
    { emoji: '🐘', label: 'Elephant', renderSize: 80  },
  ],
  // Correct order = items array order (index 0 = smallest)
}
```

### MemoryMatchGame lesson data shape
```js
{
  slug: 'memory-animals-1',
  word: 'Animals',
  emoji: '🐶',
  gameType: 'memoryMatch',
  // ageGroup not needed — same grid for both age groups
  pairs: [
    ['🐶','🐶'], ['🐱','🐱'], ['🐰','🐰'],
    ['🐻','🐻'], ['🦊','🦊'], ['🐸','🐸'],
  ],
  // OR: derive pairs from standard lesson emoji if all 6 lessons provided
}
```

### Age filter in MiniGame.jsx
```jsx
// Source: KidHome.jsx line 54, KidContext.jsx line 9
const { activeKid } = useKid();
const mod = getModule(moduleSlug);

// Filter age-appropriate lessons before passing to game
const lessons = (mod.ageFiltered && activeKid?.ageGroup)
  ? mod.lessons.filter(l => !l.ageGroup || l.ageGroup === activeKid.ageGroup)
  : mod.lessons;

// Pass `lessons` (not `mod.lessons`) to all game components
```

### Verified CSS tokens for game feedback
```js
// Source: client/src/index.css + MatchingGame.jsx
const styles = {
  correct: {
    background: 'var(--btn-green-base)',   // green
    boxShadow: '0 0 24px rgba(16,185,129,0.5)',
  },
  wrong: {
    background: 'var(--accent-red)',       // red
    animation: 'shake 0.5s ease',
  },
  // Neutral/unflipped card:
  card: {
    background: 'var(--btn-blue-base)',
    boxShadow: '0 8px 0 var(--btn-blue-shade)',
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single logic module (matching, pattern, oddOneOut) | Logic module + 3 new game types (sort, trueFalse, memoryMatch) | Phase 9 | Expands reasoning content; ages 4-6 and 6-8 served differently |
| All lessons passed to MiniGame without filtering | Module page filters by `kid.ageGroup` | Phase 9 | Age-appropriate content automatically routed |
| MatchingGame as only card-flip game | Separate MemoryMatchGame with CSS 3D | Phase 9 | Clean separation; MatchingGame unchanged |

**Deprecated/outdated:**
- `logic.js` slug `'logic'` and title `'Logic & Patterns'` — the existing module may need its `games` array updated to include `'trueFalse'`, `'sort'`, `'memoryMatch'` alongside existing `'matching'`, `'pattern'`, `'oddOneOut'`
- `ageFiltered` flag on module: this field doesn't exist yet — must be added to the `logicModule` object in `logic.js` as a signal to MiniGame that age filtering should apply

## Open Questions

1. **ageGroup value canonicalization**
   - What we know: AddKidModal defaults to `'5-6'`; CONTEXT.md specifies `'4-6'` and `'6-8'`; Prisma schema stores `ageGroup` as nullable String
   - What's unclear: Do existing kids in production DB have `'5-6'` stored, or have they been set using other values?
   - Recommendation: Add a fallback in the age filter: if `kid.ageGroup` starts with `'4'` or `'5'`, use `'4-6'` bucket; if it starts with `'6'` or `'7'`, use `'6-8'` bucket. OR update AddKidModal select options to use `'4-6'` and `'6-8'` exactly. Plan 09-04 should address this explicitly.

2. **MemoryMatch lesson data architecture**
   - What we know: 6 pairs per lesson, 3 lessons total. Pairs could be embedded in the lesson object directly, or MemoryMatchGame could derive them from 6 consecutive lesson emojis.
   - What's unclear: Whether MemoryMatchGame receives one "MemoryMatch lesson" (containing all 6 pairs) or iterates over 6 individual lessons.
   - Recommendation: Each MemoryMatch "lesson" in logic.js should contain the 6 pairs directly (as a `pairs` array). MemoryMatchGame receives `lessons` and uses `lessons[0]` (the current game's data). This is cleaner than requiring exactly 6 lesson items.

3. **logic.js `games` array update**
   - What we know: Current `logicModule.games = ['matching', 'pattern', 'oddOneOut']`. Phase 9 adds 3 new game types.
   - What's unclear: Should the games array be updated to `['trueFalse', 'sort', 'memoryMatch']` only (replacing old games), or extended to include all 6?
   - Recommendation: Replace with the 3 new games — the new lessons are designed for the new game types. The existing matching/pattern/oddOneOut lessons (first 14) would still exist in the data but wouldn't be played. Alternatively, keep all 6 games and serve the right lesson subset to each. Plan 09-04 should decide.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 (server) |
| Config file | `server/vitest.config.js` or `package.json` scripts |
| Quick run command | `cd server && npx vitest run tests/adaptive/` |
| Full suite command | `cd server && npm test` |

Note: Client-side components (TrueFalseGame, MemoryMatchGame, SortGame) have no automated test infrastructure in this project. All game component verification is manual (visual smoke test in browser). Server-side integration point (MiniGame dispatch) is already covered by infra02 tests from Phase 8.

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Logic module has 18 new lessons with correct `gameType` | unit | `cd server && npx vitest run tests/adaptive/cont01-logic-lessons.test.js` | Wave 0 |
| CONT-02 | Logic module not in FREE_MODULE_SLUGS (freemium gate) | manual | Verify KidHome.jsx line 10 in code review | N/A — code inspection |
| CONT-03 | Age filtering returns correct subset for each ageGroup | unit | `cd server && npx vitest run tests/adaptive/cont03-age-filter.test.js` | Wave 0 |
| GAME-01 | TrueFalseGame calls onComplete(100) on correct, onComplete(0) on wrong | manual | Smoke test in browser | N/A — frontend |
| GAME-02 | SortGame tap-to-place reorders items, Check computes score | manual | Smoke test in browser + iOS device | N/A — frontend |
| GAME-03 | MemoryMatchGame cards flip, matched pairs lock, 900ms mismatch delay | manual | Smoke test in browser | N/A — frontend |
| INTG-01 | onComplete(score) flows through MiniGame to recordLesson correctly | integration (Phase 8 covered) | `cd server && npx vitest run tests/adaptive/infra02-stats-endpoint.test.js` | exists (Phase 8) |

### Sampling Rate
- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/adaptive/`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npm test`
- **Phase gate:** Full suite green + manual smoke test of all 3 game types before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/tests/adaptive/cont01-logic-lessons.test.js` — verifies 18 new lessons exist with correct `gameType`, `ageGroup`, and required fields
- [ ] `server/tests/adaptive/cont03-age-filter.test.js` — unit tests for the age filter function (pure function, easy to isolate)

*(Note: The age filter logic in MiniGame.jsx is client-side. To make it testable, extract it as a pure utility function in `client/src/data/index.js` or a dedicated `ageFilter.js` helper, then test it as a pure function via a simple Node.js-compatible test.)*

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `client/src/components/games/MatchingGame.jsx` — card state machine, shuffle, scoring formula, grid layout, CSS token usage
- Direct codebase read: `client/src/pages/MiniGame.jsx` — prop contract, dispatch pattern, already-wired gameType strings from Phase 8
- Direct codebase read: `client/src/data/modules/logic.js` — existing module structure, lesson shape, games array
- Direct codebase read: `client/src/data/index.js` — MODULE_REGISTRY, freemium gate confirmed absent for logic
- Direct codebase read: `client/src/pages/KidHome.jsx` — `FREE_MODULE_SLUGS = ['alphabet','numbers','shapes']` confirmed at line 10; freemium lock at line 194
- Direct codebase read: `client/src/lib/sound.js` — `speakWord()` API, TTS fallback logic
- Direct codebase read: `client/src/index.css` — all available keyframe animation names confirmed
- Direct codebase read: `server/prisma/schema.prisma` — `ageGroup String?` at line 64 confirmed
- Direct codebase read: `server/src/routes/auth.js` — `ageGroup` returned in kid JWT at line 118
- Direct codebase read: `client/src/components/kid/AddKidModal.jsx` — `'5-6'` default ageGroup value confirmed (potential mismatch with lesson data)
- Direct codebase read: `.planning/phases/09-game-components-content/09-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- MDN CSS documentation (known): `backface-visibility`, `perspective`, `transform-style: preserve-3d` — CSS 3D flip technique is well-established and widely supported; iOS Safari requires `-webkit-` prefix for `backface-visibility`
- iOS/Android touch event behavior (known): HTML5 `draggable` attribute does not trigger touch events on iOS Safari; `onClick` on `<button>` works reliably on all touch devices

### Tertiary (LOW confidence)
- None — all critical claims verified from codebase directly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing stack confirmed from codebase
- Architecture: HIGH — all patterns sourced from existing game components in the same codebase
- Pitfalls: HIGH — CSS 3D prefix issues and touch event behavior are well-documented browser facts; ageGroup mismatch directly observed in AddKidModal.jsx
- Content authoring: HIGH — lesson data shapes derived from CONTEXT.md decisions + existing lesson patterns

**Research date:** 2026-03-23
**Valid until:** This phase is self-contained; research valid until Phase 9 execution completes. No external library dependencies to track.
