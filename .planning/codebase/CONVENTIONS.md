# Coding Conventions

**Analysis Date:** 2026-03-18

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` — `MatchingGame.jsx`, `ProtectedRoute.jsx`, `KidHome.jsx`
- React context: PascalCase with `Context` suffix — `AuthContext.jsx`, `KidContext.jsx`
- React hooks: camelCase with `use` prefix, `.js` extension — `useProgress.js`
- Server routes: camelCase `.js` — `auth.js`, `progress.js`, `dailyChallenge.js`
- Server middleware: camelCase `.js` — `auth.js`, `kidAuth.js`, `progressSync.js`
- Server services: camelCase `.js` — `weeklyDigest.js`, `progressSync.js`
- Utility/lib: camelCase `.js` — `api.js`, `localStorage.js`, `sound.js`, `supabase.js`
- Data modules: camelCase `.js` — `alphabet.js`, `bodyParts.js`, `householdObjects.js`

**Functions:**
- React component functions: PascalCase — `export default function MatchingGame()`
- Event handlers: camelCase prefixed with `handle` — `handleFlip()`, `handleDigit()`, `handleBackspace()`
- Navigation functions: camelCase with directional names — `goNext()`, `goPrev()`
- Helper/utility: camelCase descriptive — `shuffle()`, `shuffleLetters()`, `pickRounds()`, `computeStars()`
- Server route helpers: camelCase verbs — `resolveKidAccess()`, `resolveWriteAccess()`, `requireTeacher()`, `getParent()`, `verifyKidOwnership()`
- Exported service functions: camelCase — `upsertProgress()`, `sendWeeklyDigests()`, `generateJoinCode()`

**Variables:**
- camelCase throughout — `activeKid`, `kidSession`, `scoreData`, `totalStars`
- Constants: SCREAMING_SNAKE_CASE for truly static — `SCORE_FIELDS`, `MODULE_REGISTRY`, `DAILY_MODULE_SLUGS`, `AVATAR_EMOJIS`, `TILE_COLORS`, `KID_TOKEN_EXPIRY`
- Temporary/destructured discard: underscore prefix — `const { pin: _pin, ...kidData } = kid`

**Types/Roles:**
- Role strings are lowercase: `'parent'`, `'teacher'`, `'kid'`
- Token type strings are lowercase: `'kid'`, `'supabase'`
- Game type keys are camelCase strings: `'matching'`, `'tracing'`, `'oddOneOut'`, `'scramble'`

## Code Style

**Formatting:**
- No Prettier config found — formatting is manual/editor-driven
- Indentation: 2 spaces throughout (client and server)
- Single quotes for strings in server (CommonJS) code
- Single quotes for strings in client (ESM) code
- No trailing semicolons in some places, present in others — inconsistent

**Linting:**
- Client: ESLint flat config at `client/eslint.config.js`
  - Extends `@eslint/js` recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
  - `no-unused-vars`: error, with `varsIgnorePattern: '^[A-Z_]'` (allows SCREAMING_SNAKE vars)
  - Files: `**/*.{js,jsx}` only (no TypeScript)
- Server: No ESLint config detected

## Module System

**Client:** ESM (`"type": "module"` in `client/package.json`)
- All imports use `import` / `export`
- Named exports for context hooks: `export function useAuth()`, `export function useKid()`
- Named exports for data utilities: `export function getModule()`, `export const MODULE_REGISTRY`
- Default exports for React components: `export default function MatchingGame()`

**Server:** CommonJS (`"type": "commonjs"` in `server/package.json`)
- All imports use `require()`
- Module exports: `module.exports = router` or `module.exports = { fn1, fn2 }`
- Public route handlers additionally exported as named keys: `module.exports.kidLookupHandler = kidLookupHandler`

## Import Organization

**Client pattern (React files):**
1. React core hooks — `import { useState, useMemo } from 'react'`
2. React Router — `import { useNavigate, useParams } from 'react-router-dom'`
3. Context hooks — `import { useKid } from '../context/KidContext'`
4. Local lib/utils — `import { api } from '../lib/api'`
5. Local data — `import { getModule } from '../data/index'`
6. Component imports — `import MatchingGame from '../components/games/MatchingGame'`

**Server pattern (route files):**
1. Express — `const express = require('express')`
2. Third-party packages — `const bcrypt = require('bcrypt')`
3. Local db — `const prisma = require('../lib/db')`
4. Local middleware/services — `const { upsertProgress } = require('../services/progressSync')`

**Path aliases:** None — all imports use relative paths (`../`, `../../`)

## Error Handling

**Server routes:** All async route handlers use `try/catch` with `next(err)` to pass errors to Express global handler.
```js
router.get('/:kidId', async (req, res, next) => {
  try {
    // ...
  } catch (err) {
    next(err);
  }
});
```

**Global Express error handler** in `server/src/index.js`:
```js
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
```

**Client API calls:** Errors thrown from `api.js` (fetch failure) are caught at the call site with `try/catch` or `.catch()`. Many non-critical errors are swallowed silently:
```js
api.post(`/api/progress/${kidId}/sync`, { entries })
  .then(() => { markSynced(kidId); fetchProgress(); })
  .catch(() => {}); // silent — will retry next session
```

**JSON parse errors:** Guarded with empty `catch {}` blocks (no rethrow):
```js
} catch { /* ignore decode errors */ }
```

**Non-critical subsystems** (streak update in `progressSync.js`) use isolated try/catch so they don't fail the parent operation:
```js
} catch (streakErr) {
  // Non-critical — don't fail the whole progress save
  console.error('[streak] Update failed:', streakErr.message);
}
```

**Auth validation:** Early return pattern with `res.status(4xx).json({ error: '...' })` before business logic.

## Logging

**Framework:** `console.log` / `console.error` / `console.warn` — no structured logging library

**Patterns:**
- Server logs use bracket-prefixed tags: `console.error('[Auth] Verification error:', ...)`, `console.error('[digest] Unhandled error:', ...)`
- Client errors use plain `console.error('Progress fetch failed', err)`
- Dev-only fallback logs: `console.warn('[Auth] Supabase not configured — using mock user for development.')`
- Startup logs confirm services: `console.log('[digest] Weekly digest cron scheduled (Mon 08:00)')`

## Comments

**When to Comment:**
- Explain non-obvious business logic: `// Speak the word when a text-only card is revealed so pre-readers can hear it`
- Document auth quirks: `// getUser() on fresh Supabase accounts sometimes omits email — fall back to body`
- Mark access control intent: `// Public kid auth endpoints (no requireAuth)`, `// Write access — only parent who owns the kid, or the kid themselves`
- Explain critical ordering: `// Kid direct session (PIN login) — must check BEFORE !session, kids have no Supabase session`

**Section dividers:** Used in longer files with `// ─── Section Name ───` style (em-dash box drawing)

**JSDoc/TSDoc:** Not used — no type annotations anywhere (plain JS, no TypeScript)

## Inline Styles vs CSS

**Pattern:** React components use JS `styles` objects defined at the bottom of each file:
```js
const styles = {
  container: { padding: 'var(--space-xl)', maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 'var(--font-lg)', fontWeight: 900, ... },
};
```
Applied as `style={styles.container}`. Dynamic styles merge via spread: `style={{ ...styles.card, ...(isMatched(i) ? styles.cardMatched : {}) }}`.

**CSS variables** defined in `client/src/index.css` for design tokens (colors, spacing, font sizes). Used throughout inline styles as `var(--primary)`, `var(--space-xl)`, `var(--font-lg)`.

**Global CSS** (`client/src/index.css`) only handles: reset, CSS variables, fonts, utility classes, animations. No component-scoped CSS modules.

**Exception:** `client/src/components/layout/ParentLayout.css` is the only separate CSS file (imported directly into `ParentLayout.jsx`).

## Function Design

**Size:** Most functions are concise (5–30 lines). Route handlers that do complex DB operations run 30–60 lines. The largest single file is `client/src/pages/KidHome.jsx` at 482 lines.

**Parameters:** Prefer object destructuring in React components: `function MatchingGame({ lessons, onComplete })`. Server helpers receive `(req, res)` or `(req, kidId)`.

**Return Values:**
- Server route handlers: `res.json(data)` on success, `res.status(4xx).json({ error: '...' })` on validation failure
- Async helpers: return Prisma records or `null` on not-found/unauthorized
- Client hooks: return plain objects with state and action functions

## State Management

**React state:** `useState` for local UI state. No Redux or Zustand.
**Shared state:** React Context (`AuthContext`, `KidContext`) for auth and active kid selection.
**Offline persistence:** `localStorage` via `client/src/lib/localStorage.js` with `edu_progress_{kidId}` keys.
**Kid session:** `sessionStorage` with `kidToken` and `kidData` keys (cleared on tab close).

## Data Access Pattern (Server)

All DB access goes through the singleton Prisma client at `server/src/lib/db.js`. Routes import it directly:
```js
const prisma = require('../lib/db');
```
No repository layer — Prisma queries are written directly in route files and service files.

---

*Convention analysis: 2026-03-18*
