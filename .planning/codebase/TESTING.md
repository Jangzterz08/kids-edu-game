# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:** None — no test framework is installed or configured.

**Assertion Library:** None

**Test Files Found:** Zero test files exist in the codebase. No `*.test.*` or `*.spec.*` files found anywhere in `client/src/` or `server/src/`.

**Test Config:** No `jest.config.*`, `vitest.config.*`, or equivalent detected.

**Run Commands:**
```bash
# No test commands exist in either package.json
# client/package.json scripts: dev, build, lint, preview
# server/package.json scripts: dev, start, migrate, seed
```

## Current State

This codebase has **zero automated tests**. There is no unit, integration, or E2E test coverage anywhere. The only quality tooling present is ESLint in the client.

## What Would Need to Be Set Up

Before any tests can be written, the following infrastructure must be added.

### Recommended Client Testing Stack

**Framework:** Vitest (matches Vite build toolchain already in use)

**Install:**
```bash
cd client
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Config addition** to `client/vite.config.js`:
```js
import { defineConfig } from 'vite'

export default defineConfig({
  // ... existing plugins ...
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

**Setup file** `client/src/test/setup.js`:
```js
import '@testing-library/jest-dom';
```

**Run commands (once installed):**
```bash
npx vitest              # watch mode
npx vitest run          # single run
npx vitest --coverage   # coverage report
```

### Recommended Server Testing Stack

**Framework:** Jest (common for CommonJS Node.js projects)

**Install:**
```bash
cd server
npm install --save-dev jest supertest
```

**Config** in `server/package.json`:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
},
"jest": {
  "testEnvironment": "node",
  "testMatch": ["**/__tests__/**/*.js", "**/*.test.js"]
}
```

## Recommended Test File Organization

### Client

Co-locate test files next to source:
```
client/src/
├── components/
│   └── games/
│       ├── MatchingGame.jsx
│       └── MatchingGame.test.jsx   ← co-located
├── lib/
│   ├── localStorage.js
│   └── localStorage.test.js       ← co-located
├── context/
│   └── AuthContext.test.jsx        ← co-located
└── test/
    └── setup.js                    ← global setup only
```

### Server

Co-locate or use `__tests__` alongside routes:
```
server/src/
├── routes/
│   ├── auth.js
│   └── auth.test.js               ← co-located
├── services/
│   ├── progressSync.js
│   └── progressSync.test.js       ← co-located
└── middleware/
    ├── kidAuth.js
    └── kidAuth.test.js            ← co-located
```

## Highest-Priority Test Targets

These are the units that are most logic-dense and most critical to test first:

### 1. `server/src/services/progressSync.js` — `upsertProgress()` and `computeStars()`

The star calculation and best-score merging logic is complex and has no coverage. Pure function `computeStars()` can be tested without DB.

```js
// progressSync.test.js (example pattern to follow)
const { computeStars } = require('./progressSync'); // requires export

describe('computeStars', () => {
  test('returns 0 when not viewed', () => {
    expect(computeStars({ viewed: false })).toBe(0);
  });

  test('returns 1 when viewed with no scores', () => {
    expect(computeStars({ viewed: true })).toBe(1);
  });

  test('returns 3 when all scores >= 80 with 2+ games', () => {
    expect(computeStars({ viewed: true, matchScore: 90, quizScore: 85 })).toBe(3);
  });

  test('returns 2 when any score >= 60', () => {
    expect(computeStars({ viewed: true, matchScore: 65 })).toBe(2);
  });
});
```

### 2. `server/src/middleware/kidAuth.js` — `signKidToken()`, `verifyKidToken()`, `decodeTokenType()`

Pure functions with no external dependencies (only `jsonwebtoken`). Fully testable without mocking.

```js
// kidAuth.test.js (example pattern to follow)
process.env.KID_JWT_SECRET = 'test-secret';
const { signKidToken, verifyKidToken, decodeTokenType } = require('./kidAuth');

describe('kidAuth', () => {
  test('signs and verifies a kid token', () => {
    const token = signKidToken('kid-123');
    const payload = verifyKidToken(token);
    expect(payload.sub).toBe('kid-123');
    expect(payload.type).toBe('kid');
  });

  test('decodeTokenType identifies kid token', () => {
    const token = signKidToken('kid-abc');
    expect(decodeTokenType(token)).toBe('kid');
  });

  test('decodeTokenType returns supabase for non-kid token', () => {
    expect(decodeTokenType('not.a.valid.token')).toBe('supabase');
  });
});
```

### 3. `client/src/lib/localStorage.js` — offline progress functions

Pure functions using `localStorage`. Testable with jsdom environment.

```js
// localStorage.test.js (example pattern to follow)
import { upsertOfflineLesson, loadOfflineProgress, markSynced } from './localStorage';

describe('offline progress', () => {
  beforeEach(() => localStorage.clear());

  test('upsertOfflineLesson marks store as dirty', () => {
    upsertOfflineLesson('kid-1', 'lesson-a', { starsEarned: 2 });
    const store = loadOfflineProgress('kid-1');
    expect(store.dirty).toBe(true);
    expect(store.entries['lesson-a'].starsEarned).toBe(2);
  });

  test('markSynced clears dirty flag', () => {
    upsertOfflineLesson('kid-1', 'lesson-a', { starsEarned: 1 });
    markSynced('kid-1');
    const store = loadOfflineProgress('kid-1');
    expect(store.dirty).toBe(false);
  });
});
```

### 4. `client/src/data/index.js` — `getModule()`, `buildQuizOptions()`, `getDailyChallengeSlug()`

Pure data-lookup functions. No async, no DOM, no network.

### 5. `server/src/routes/auth.js` — `kidLookupHandler`, `kidLoginHandler`

Integration tests using `supertest` against an in-memory Express app with mocked Prisma.

## Mocking Patterns (When Tests Are Added)

**Prisma (server):**
```js
jest.mock('../lib/db', () => ({
  kidProfile: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  // ... other models needed
}));
```

**Supabase (client):**
```js
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));
```

**API client (client):**
```js
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

**What NOT to Mock:**
- Pure utility functions (`computeStars`, `shuffleLetters`, `getModule`)
- `localStorage` — jsdom provides a real implementation
- `jsonwebtoken` — use real signing with a test secret

## Coverage

**Requirements:** None currently enforced.

**Target once tests exist:**
- `server/src/services/progressSync.js` — 90%+ (core business logic)
- `server/src/middleware/kidAuth.js` — 100% (security-critical)
- `client/src/lib/localStorage.js` — 100% (offline sync reliability)
- `client/src/data/index.js` — 80%+ (data integrity)

## Test Types (Status)

**Unit Tests:** Not present. Highest priority for pure functions listed above.

**Integration Tests:** Not present. Priority: server route handlers via `supertest`.

**E2E Tests:** Not present. No framework configured (Playwright/Cypress would be applicable given React + Vite stack).

## Context-Specific Notes

**Dual JWT auth** (`kid` vs `supabase` tokens) is the most critical path to cover with tests. A regression here blocks all kid gameplay. The `decodeTokenType()` branching in `server/src/middleware/auth.js` must be tested with both token types.

**`ProtectedRoute`** (`client/src/components/auth/ProtectedRoute.jsx`) has three distinct auth modes (kid session, supabase session, no session) plus role guards — this is the second-highest priority for client component tests using React Testing Library.

**Score computation** exists in two places with slightly different implementations:
- `server/src/services/progressSync.js` — `computeStars()` (server-side)
- `client/src/pages/MiniGame.jsx` — `computeStars()` (client-side)
Both should be tested to verify they stay in sync.

---

*Testing analysis: 2026-03-18*
