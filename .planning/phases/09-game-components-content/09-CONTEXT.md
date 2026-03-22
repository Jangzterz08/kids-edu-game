# Phase 9: Game Components & Content - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning
**Source:** User design session

<domain>
## Phase Boundary

Phase 9 delivers 3 new React game components (TrueFalseGame, MemoryMatchGame, SortGame) and the Logic & Reasoning module lesson data with age-group filtering. All components follow the `{ lessons, onComplete(score: 0-100) }` prop contract. Scores flow through existing coins, streak, and SM-2 systems without modification. The Logic module is premium (behind freemium gate).

**Not in scope:** New game types beyond sort/trueFalse/memoryMatch. Sound effects system. Drag-and-drop sort. Dynamic difficulty scaling (v2).

</domain>

<decisions>
## Implementation Decisions

### Lesson Content for New Games (CONT-01, CONT-03)

**Total new lessons:** 18 (3 per game type × 2 age groups × 3 lessons each). Combined with existing 14 logic lessons = 32 total.

**TrueFalse content (ages 4–6):**
- Mix of visual property claims and category membership claims
- Emoji-only — no text. Claims spoken aloud via `speakWord()`
- Examples: "Is 🍎 red?" (property), "Is 🐱 an animal?" (category)
- Score: 100 (correct) or 0 (incorrect) — binary

**TrueFalse content (ages 6–8):**
- Factual knowledge claims — text-based, spoken aloud
- Examples: "The sun is a star" (true), "Fish can fly" (false)
- Real-world knowledge kids this age should know

**Sort content (both age groups):**
- Size ordering — "Put these from smallest to biggest"
- Items have explicit `renderSize` pixel values for visual size distinction
- 4–6: 3 items per lesson (simpler). 6–8: 4–5 items (more challenge)
- Examples: 🐜 → 🐱 → 🐘 (ant, cat, elephant)

**MemoryMatch content:**
- Emoji-to-emoji pairs — no text labels (pre-reader safe)
- 6 pairs per lesson (12 cards total, 4×3 grid)
- Content: familiar emoji pairs (animals, food, nature) — similar to existing matching lessons

**Age group field:** Every new lesson includes `ageGroup: '4-6'` or `ageGroup: '6-8'`. Module page filters lessons by `kid.ageGroup` before passing to MiniGame.

### MemoryMatch Architecture (GAME-03)

**Decision: New MemoryMatchGame.jsx** — separate component, NOT extending MatchingGame.jsx.

**Rationale:** MatchingGame has 165 lines of image/word/dots rendering logic that MemoryMatch doesn't need. A clean new component is simpler than conditionalizing all that code. MemoryMatch also requires CSS 3D flip transforms (`rotateY(180deg)`, `backface-visibility: hidden`) which MatchingGame doesn't use.

**Grid:** 6 pairs / 12 cards in 4×3 grid — same layout as MatchingGame for consistency.

**Scoring:** Attempts-based efficiency (same formula as MatchingGame: `100 - extra_attempts * 8`, floored at 0).

**Mismatch delay:** 900ms flip-back (matches MatchingGame).

### Game Feedback Patterns

**TrueFalse feedback:**
- Correct: button turns green + ✔️ checkmark, brief celebration
- Wrong: button shakes + turns red ✖️, correct answer highlighted in green
- Matches existing game palette (`--btn-green-base` = correct, `--accent-red` = error)

**Sort feedback:**
- Reveal at end only — kid places all items, taps "Check" button
- Correct items glow green, wrong items shake red
- Score = percentage of items in correct position
- No hints during placement — tests reasoning

**MemoryMatch feedback:**
- Match: cards turn green + bounce animation (same as MatchingGame `cardMatched` + `match-bounce`)
- Mismatch: cards flip back after 900ms (same as MatchingGame)

**Auto-advance:** All 3 games show brief results (score/celebration) for ~1.5s, then auto-advance to next game. MiniGame.jsx handles the sequence — games just call `onComplete(score)` after the delay.

**Sound:** No sound effects. Visual feedback only. `speakWord()` used for TrueFalse claim audio and replay button only. Consistent with Phase 2 precedent (audio system deferred).

### Claude's Discretion

- MemoryMatch card back design ("?" like MatchingGame, 🧠 brain, or something else)
- Exact celebration animation for brief results display
- Sort "Check" button styling and placement
- TrueFalse button layout (side-by-side vs stacked)
- Specific emoji choices for lesson content (within the decided themes)
- Whether to extract shared utilities from MatchingGame (shuffle, scoring) into a common helper

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` — GAME-01, GAME-02, GAME-03, CONT-01, CONT-02, CONT-03, INTG-01 requirements with exact specs
- `.planning/ROADMAP.md` §Phase 9 — Success criteria, plan breakdown, dependency on Phase 8

### Phase 8 Infrastructure (dependency)
- `.planning/phases/08-infrastructure/08-01-PLAN.md` — Prisma migration + SCORE_FIELDS wiring
- `.planning/phases/08-infrastructure/08-02-PLAN.md` — MiniGame routing + stats endpoint
- `.planning/phases/08-infrastructure/08-RESEARCH.md` — Technical research for infrastructure changes

### Existing Game Components (patterns to follow)
- `client/src/components/games/MatchingGame.jsx` — Card flip, shuffle, attempts scoring, grid layout, styles pattern
- `client/src/pages/MiniGame.jsx` — Game routing, score recording, handleGameComplete flow
- `client/src/data/modules/logic.js` — Existing logic module with 14 lessons (matching, pattern, oddOneOut)
- `client/src/data/modules/alphabet.js` — Lesson data structure reference (slug, word, emoji, imageFile, games array)

### Design & UX
- `.planning/phases/02-polish-ux/02-CONTEXT.md` — LogicLike benchmark, Ollie mascot, ocean theme, no-technical-language rule

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MatchingGame.jsx` — `shuffle()` helper, attempts-based scoring formula (`100 - extra * 8`), grid layout styles, card state management pattern (flipped/matched/locked)
- `speakWord()` from `lib/sound.js` — Used by TrueFalseGame for claim audio
- `DotGrid` component — Not needed for new games but shows the pattern of game-specific sub-components
- CSS variables (`--btn-green-base`, `--btn-blue-base`, `--accent-red`, `--glass-bg`) — All game styles use these

### Established Patterns
- All games: `export default function GameName({ lessons, onComplete })` — default export, destructured props
- Styles object at bottom of file: `const styles = { ... }` with CSS-in-JS using `var(--token)` references
- State management: `useState` for game state (no external state lib)
- Score reporting: `setTimeout(() => onComplete(score), 700)` — brief delay before reporting completion
- Card rendering: conditional styles via spread `style={{ ...styles.card, ...(isActive ? styles.cardActive : {}) }}`

### Integration Points
- `MiniGame.jsx` lines 49-51 — Already routes `sort`, `trueFalse`, `memoryMatch` to placeholder (Phase 8). Need to import and render actual components
- `logic.js` — Must add new lessons with `ageGroup` field and update `games` array to include `'trueFalse', 'sort', 'memoryMatch'`
- `client/src/data/index.js` — Logic module already imported; no change needed for registry
- Module page — Must filter `mod.lessons` by `kid.ageGroup` before passing to MiniGame

</code_context>

<specifics>
## Specific Ideas

### Age-Appropriate Design
- 4–6 lessons: emoji-only, no text, spoken audio, 3 sort items (simpler)
- 6–8 lessons: text-based claims, factual knowledge, 4–5 sort items (harder)
- MemoryMatch: same grid size for both age groups (6 pairs) — emoji pairs are universally accessible

### Consistency with Existing Games
- MemoryMatchGame follows MatchingGame's visual language: same grid density, same matched-card green glow, same bounce animation on match
- SortGame "Check" button at end mirrors quiz-style "submit and reveal" pattern
- TrueFalse green/red feedback matches existing correct/incorrect palette across all games

</specifics>

<deferred>
## Deferred Ideas

- **Drag-and-drop sort** via `@dnd-kit/core` — SORT-01 in v2 requirements. Deferred until tap-to-place validated with real usage
- **Dynamic difficulty scaling** — AGE-01 in v2. Currently uses static age-group filter
- **Sound effects** (correct/wrong chimes) — Audio system deferred since Phase 2
- **Ollie mascot reactions** in games — Character-driven feedback deferred; visual color feedback is sufficient
- **Additional logic modules** (sequences, balance puzzles) — EXP-01 in v2, pending engagement signal

</deferred>

---

*Phase: 09-game-components-content*
*Context gathered: 2026-03-22 via user design session*
*Design benchmark: LogicLike.com — aspirational kids learning UX (carried from Phase 2)*
