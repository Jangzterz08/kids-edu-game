# Requirements: KidsLearn

**Defined:** 2026-03-22
**Core Value:** Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.

## v1.1 Requirements

Requirements for milestone v1.1 — Logic & Reasoning module with 3 new game types.

### Infrastructure

- [ ] **INFRA-01**: Prisma migration adds `sortScore Int?`, `trueFalseScore Int?`, `memoryMatchScore Int?` to `LessonProgress`
- [ ] **INFRA-02**: `SCORE_FIELDS` in `progressSync.js` includes all 3 new score field names so star computation, coins, and SM-2 scheduling work for new game types
- [ ] **INFRA-03**: `MiniGame.jsx` routing block handles `sort`, `trueFalse`, and `memoryMatch` gameType strings — missing entries silently award 1 star regardless of performance
- [ ] **INFRA-04**: `gameAccuracy` object in `GET /api/progress/:kidId/stats` includes `sortScore`, `trueFalseScore`, `memoryMatchScore` keys so parent analytics dashboard shows new game performance

### Content

- [ ] **CONT-01**: Logic & Reasoning module defined in `client/src/data/logic.js` with at least 6 lessons — 3 per age group (4–6 and 6–8) — covering sort, trueFalse, and memoryMatch game types
- [ ] **CONT-02**: Logic module added to module registry (`client/src/data/index.js`) and integrated into freemium gate (remains behind premium lock — first 3 free modules are alphabet, numbers, shapes)
- [ ] **CONT-03**: Each logic lesson includes `ageGroup` field; module page filters lessons by `kid.ageGroup` before passing to MiniGame so age-appropriate content is shown automatically

### Games

- [ ] **GAME-01**: `TrueFalseGame` React component — displays emoji claim auto-spoken via `speakWord()` on mount with replay button; kid taps True or False; correct answer revealed with visual feedback; calls `onComplete(score)` where score is 100 (correct) or 0 (incorrect)
- [ ] **GAME-02**: `SortGame` React component — tap-to-select then tap-to-place ordering game; items have explicit `renderSize` pixel values for visual size distinction; uses pointer events not HTML5 drag API (iOS touch requirement); calls `onComplete(score)` based on correct order percentage
- [ ] **GAME-03**: `MemoryMatchGame` React component — emoji-to-emoji card flip pairs; no text labels (pre-reader safe); card flip uses CSS 3D transform (`rotateY(180deg)`, `backface-visibility: hidden`); match/mismatch feedback; calls `onComplete(score)` based on attempts efficiency

### Integration

- [ ] **INTG-01**: All 3 new game components follow `{ lessons, onComplete(score: 0-100) }` prop contract; scores flow through existing coins, streak, and SM-2 spaced repetition systems without modification to those systems

## v2 Requirements

Deferred to future release.

### Advanced Sort Interaction

- **SORT-01**: Drag-and-drop sort via `@dnd-kit/core` — defer until tap-to-place validated with real usage data

### Age-Adaptive Enhancements

- **AGE-01**: Dynamic difficulty scaling within logic module based on SM-2 performance data (currently uses static age-group filter)

### Content Expansion

- **EXP-01**: Additional logic modules — sequences, patterns, balance puzzles — pending Logic & Reasoning engagement signal

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop sort (HTML5 or dnd-kit) | HTML5 breaks iOS touch; dnd-kit adds install complexity — tap-to-place is sufficient for v1.1 |
| Word-based trueFalse for ages 4–6 | Pre-readers need audio + emoji only; text claims deferred to 6–8 variant |
| MemoryMatch with word labels | Existing MatchingGame already covers word-pair matching; new component is emoji-only |
| New module in free tier | Free tier is fixed at 3 modules (alphabet, numbers, shapes) — changing this is a pricing decision |
| Sequences / balance puzzle game types | Out of scope this milestone; research recommended them as v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 8 | Pending |
| INFRA-02 | Phase 8 | Pending |
| INFRA-03 | Phase 8 | Pending |
| INFRA-04 | Phase 8 | Pending |
| CONT-01 | Phase 9 | Pending |
| CONT-02 | Phase 9 | Pending |
| CONT-03 | Phase 9 | Pending |
| GAME-01 | Phase 9 | Pending |
| GAME-02 | Phase 9 | Pending |
| GAME-03 | Phase 9 | Pending |
| INTG-01 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
