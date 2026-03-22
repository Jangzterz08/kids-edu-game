# Stack Research

**Domain:** New game types (sort, trueFalse, memoryMatch) in existing React + Vite kids educational app
**Researched:** 2026-03-22
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

No new core frameworks. All three game types are implemented as pure React components following the
existing pattern in `client/src/components/games/`. The codebase constraints are firm: React 19.2,
Vite 7, inline styles, CSS custom properties from `index.css`.

### New Library: @dnd-kit/core + @dnd-kit/sortable (sort game only)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @dnd-kit/core | 6.3.1 | DnD context, sensors, drag overlay | Lightest maintained drag library (~10 kB core). Touch-first sensor design with configurable delay and tolerance — critical for 4–8 year old fingers on tablets. Keyboard sensor included for accessibility. Only correct choice since react-beautiful-dnd is fully deprecated (archived Aug 2025) and react-dnd lacks first-class touch support. |
| @dnd-kit/sortable | 10.0.0 | Sortable preset with reorder helpers | Wraps `useSortable` + `arrayMove` so the SortGame component only manages the item array — no manual position math. Compatible with `@dnd-kit/core` 6.3.1. |

**React 19 peer dep note:** `@dnd-kit/core` declares `peerDependencies: { react: ">=16.8.0" }`. npm 7+ flags
this as a conflict with React 19.2. Install with `--legacy-peer-deps`. The library works at runtime;
the peer dep spec is simply unmaintained (last publish: ~1 year ago). MEDIUM confidence — verified by
community reports but not by an official dnd-kit React 19 release note.

### No New Library: trueFalse

`trueFalse` is a tap-to-answer interaction identical in structure to `QuizGame` (two big buttons instead
of four options). Uses React state only. No library needed.

### No New Library: memoryMatch

The existing `MatchingGame.jsx` already implements the core memory-match pattern (flip state, pair
matching, `match-bounce` keyframe animation). `memoryMatch` is a purpose-built variant of that same
pattern — it adds the 3D CSS flip animation (`transform: rotateY(180deg)`, `transform-style: preserve-3d`,
`backface-visibility: hidden`) via inline styles. No animation library needed; the CSS transform API
is universally supported and already used in the codebase.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | 3.2.2 | `CSS.Transform.toString()` helper for drag transform string | Use inside SortGame's `useSortable` hook to apply the drag position inline style |

No other supporting libraries. All audio feedback routes through the existing `speakWord` / `playSound`
in `client/src/lib/sound.js`. All toast notifications use the installed `sonner` 2.0.7. All keyframe
animations are added to `client/src/index.css` — the existing pattern for `match-bounce`, `shake`,
`pop-correct`, etc.

### Development Tools

No new dev tooling required. Existing Vite 7 + `@vitejs/plugin-react` 5.1.1 handles JSX and HMR for
new game components without changes.

## Installation

```bash
# From client/
npm install --legacy-peer-deps @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

trueFalse and memoryMatch require zero npm installs.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @dnd-kit/core + @dnd-kit/sortable | react-beautiful-dnd | Never — archived Aug 2025, no React 18+ support |
| @dnd-kit/core + @dnd-kit/sortable | @hello-pangea/dnd | Only if you need a drop-in replacement for react-beautiful-dnd in an existing project that already used it. Not applicable here. |
| @dnd-kit/core + @dnd-kit/sortable | Drag with pointer events only (no library) | Viable for a desktop-only app; too fragile on touch for young children. dnd-kit's TouchSensor handles scroll vs. drag disambiguation which is non-trivial to hand-roll. |
| CSS 3D flip (inline styles) | react-spring / framer-motion | Only if you need physics-based spring animations across many components. Adding a 60 kB animation library for a single card flip is not justified when `transform + transition` CSS properties do the job in 4 lines. |
| @dnd-kit/react (new alpha) | @dnd-kit/core (stable) | @dnd-kit/react is v0.3.2 (alpha/experimental), API unstable. Use only in greenfield projects willing to absorb breaking changes. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-beautiful-dnd | Officially archived Aug 2025, no React 18/19 support, console deprecation warning on install | @dnd-kit/core + @dnd-kit/sortable |
| react-dnd | Requires HTML5 drag API backend; HTML5 drag has unreliable touch behavior on iOS/Android — the primary target device for this app | @dnd-kit/core (pointer + touch sensors) |
| framer-motion | 60 kB bundle addition for animations already achievable with CSS transitions and existing index.css keyframes | CSS transform + transition on card divs |
| @dnd-kit/react (alpha) | v0.3.2 — experimental, breaking API changes likely; no stable release docs | @dnd-kit/core 6.3.1 (stable) |
| react-flip-toolkit | Adds ~15 kB for FLIP position animations. The sort game's reorder visual is handled by dnd-kit's built-in `SortableContext` transitions. Over-engineering for the use case. | @dnd-kit/sortable built-in transition styles |

## Stack Patterns by Variant

**For the `sort` game type:**
- Use `DndContext` (from `@dnd-kit/core`) wrapping the game's item list
- Use `SortableContext` + `useSortable` (from `@dnd-kit/sortable`) per item
- Activate `PointerSensor` with `activationConstraint: { distance: 8 }` to avoid accidental drags
- Activate `TouchSensor` with `activationConstraint: { delay: 200, tolerance: 5 }` for reliable touch
- On `DragEndEvent`, call `arrayMove` to reorder state, then compare to correct order
- No drag overlay needed for a linear sort list; use `useSortable`'s `transform` + `transition` directly

**For the `trueFalse` game type:**
- Pure React state, no library. Two large `<button>` elements (True / False), styled like QuizGame options
- For ages 4–6 lessons: pair a visual/emoji with a yes/no statement read aloud via `speakWord`
- For ages 6–8 lessons: short readable statement, no mandatory audio but still trigger `speakWord` on mount
- Track correct/total, call `onComplete(score)` using the same formula as QuizGame

**For the `memoryMatch` game type:**
- Pure React state with the same flip/locked/matched pattern as `MatchingGame.jsx`
- Add CSS 3D flip: each card is a `position: relative` container with `perspective: 600px`; inner wrapper uses `transform-style: preserve-3d`; front and back faces use `backface-visibility: hidden`; flipped state applies `transform: rotateY(180deg)` with `transition: transform 0.4s ease`
- Add new `@keyframes` in `index.css` for any new visual feedback (e.g., `card-flip-match`)
- `memoryMatch` differs from `MatchingGame` in that all pairs are image/emoji pairs of the same type (not image↔word), so the component data contract is simpler

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @dnd-kit/core@6.3.1 | @dnd-kit/sortable@10.0.0 | Official matching versions. Do not mix with @dnd-kit/core@5.x. |
| @dnd-kit/core@6.3.1 | @dnd-kit/utilities@3.2.2 | Matching utilities version. |
| @dnd-kit/core@6.3.1 | react@19.2.0 | Works at runtime. Requires `--legacy-peer-deps` on install due to stale peer dep declaration. |
| @dnd-kit/core@6.3.1 | vite@7.x | No conflicts. dnd-kit is a pure React library, no build tooling dependencies. |

## Integration Points in the Existing Codebase

1. **Game registration** — `logic.js` module's `games` array currently lists `['matching', 'pattern', 'oddOneOut']`. Add `'sort'`, `'trueFalse'`, `'memoryMatch'` to this array once the new components exist.

2. **GameRouter / LessonPlayer** — wherever the existing 8 game types are selected by string, add three new `case` branches pointing to `SortGame`, `TrueFalseGame`, `MemoryMatchGame`.

3. **Lesson data shape** — new lesson entries in `logic.js` will need game-type-specific fields:
   - `sort` lessons: `{ gameType: 'sort', items: [{ emoji, label, order }], attribute: 'size|count|sequence' }`
   - `trueFalse` lessons: `{ gameType: 'trueFalse', statement: string, isTrue: boolean, visualEmoji: string }`
   - `memoryMatch` lessons: consumed in pairs, same 6-lesson subset pattern as `MatchingGame`

4. **Scoring** — all three game types call `onComplete(score)` where score is 0–100. Server `computeStars` and `POST /api/progress/:kidId/lesson/:slug` require no changes.

5. **CSS keyframes** — add flip and sort-drop animations to `client/src/index.css` following the existing pattern (e.g., `match-bounce` at line 323).

## Sources

- npm registry (via WebSearch) — @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2 versions confirmed MEDIUM confidence
- github.com/atlassian/react-beautiful-dnd — archived Aug 2025, confirmed deprecated HIGH confidence
- dndkit.com — touch sensor configuration, SortableContext API MEDIUM confidence
- Client codebase inspection — `client/package.json`, `index.css`, `MatchingGame.jsx`, `QuizGame.jsx`, `logic.js` — existing patterns HIGH confidence
- WebSearch: React 19 + dnd-kit peer dep workaround via `--legacy-peer-deps` MEDIUM confidence (community reports, not official dnd-kit release note)

---
*Stack research for: KidsLearn v1.1 — sort, trueFalse, memoryMatch game types*
*Researched: 2026-03-22*
