---
phase: 01-security-hardening
verified: 2026-03-19T05:15:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 1: Security Hardening Verification Report

**Phase Goal:** Harden the KidsLearn server against the 6 identified security vulnerabilities (SEC-01 through SEC-06). All fixes must be covered by passing automated tests.
**Verified:** 2026-03-19T05:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A kid cannot buy a CoinStore item for fewer coins than its canonical server-side price, even by crafting a custom POST body | VERIFIED | `STORE_ITEMS` map in `kids.js` lines 5-14; buy handler ignores `req.body.price` entirely; `const price = item.price` (line 121); SEC-01 test with `price:0` asserts `decrement: 30` — passes |
| 2 | The kid-login endpoint rejects more than 10 requests per minute from the same IP | VERIFIED | `kidAuthLimiter` with `max: 10, windowMs: 60*1000` in `index.js` lines 35-41; applied to both endpoints lines 45-46; SEC-02 test sends 11 requests and asserts 429 — passes |
| 3 | A kid or classroom name containing HTML tags is stored and rendered escaped — no raw HTML appears in email digests | VERIFIED | `he` library imported in `weeklyDigest.js` line 4; `esc()` helper line 8-10; applied to `kid.name` (line 66), `parentName` (line 103), subject line (line 177); SEC-03 tests assert `&lt;script&gt;` presence — passes |
| 4 | Starting the server in production without Supabase env vars throws a startup error and refuses to serve traffic | VERIFIED | Guard at module-load time in `auth.js` lines 7-11; throws with message containing `SUPABASE_URL and SUPABASE_SERVICE_KEY`; SEC-04 test exercises all 4 branches — passes |
| 5 | Two simultaneous coin-purchase requests from the same kid cannot both succeed for the same item | VERIFIED | `prisma.$transaction(async (tx) => ...)` wrapping entire read-modify-write in `kids.js` lines 123-142; fresh `tx.kidProfile.findUnique` inside callback prevents stale reads; SEC-05 test verifies transaction called and already-unlocked check inside tx — passes |

**Additionally verified from PLAN must_haves:**

| # | Truth (from PLAN frontmatter) | Status | Evidence |
|---|-------------------------------|--------|----------|
| 6 | POST with unknown itemId returns 400 | VERIFIED | `if (!item) return res.status(400).json({ error: 'Unknown item' })` — kids.js line 120 |
| 7 | 11th POST to /api/auth/kid-lookup within 60s returns 429 | VERIFIED | Same `kidAuthLimiter` applied to kid-lookup — index.js line 45; SEC-02 test covers this |
| 8 | A POST to progress with extra fields like `evilField` or `kidId` in the body does not propagate to the database | VERIFIED | Explicit destructuring of exactly 9 known fields in `progress.js` lines 198-202; SEC-06 test asserts `evilField` absent from Prisma upsert call — passes |
| 9 | `buildEmailHtml` escapes undefined kid.name to "Your child" (not "undefined") | VERIFIED | `esc(kid.name) || 'Your child'` — weeklyDigest.js line 66; SEC-03 test covers this case |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `server/vitest.config.js` | Vitest node environment config | Yes | Yes — `environment: 'node'`, `include: ['tests/**/*.test.js']` | Yes — used by `npx vitest run` | VERIFIED |
| `server/tests/helpers/setup.js` | CJS mocking helpers | Yes | Yes — exports `getTestKidToken`, `spyOnPrisma` | Yes — imported by test files | VERIFIED |
| `server/tests/security/sec01-price-validation.test.js` | SEC-01 integration tests | Yes | Yes — 4 real assertions, not todos | Yes — runs in suite, all pass | VERIFIED |
| `server/tests/security/sec02-rate-limit.test.js` | SEC-02 rate-limit tests | Yes | Yes — 3 real assertions | Yes — runs in suite, all pass | VERIFIED |
| `server/tests/security/sec03-sanitization.test.js` | SEC-03 HTML escape tests | Yes | Yes — 5 real assertions | Yes — runs in suite, all pass | VERIFIED |
| `server/tests/security/sec04-startup-guard.test.js` | SEC-04 startup guard tests | Yes | Yes — 4 real assertions, uses vi.resetModules() | Yes — runs in suite, all pass | VERIFIED |
| `server/tests/security/sec05-transaction.test.js` | SEC-05 transaction tests | Yes | Yes — 3 real assertions including malformed JSON case | Yes — runs in suite, all pass | VERIFIED |
| `server/tests/security/sec06-body-destructure.test.js` | SEC-06 body isolation tests | Yes | Yes — 2 real assertions inspecting Prisma upsert args | Yes — runs in suite, all pass | VERIFIED |
| `server/src/routes/kids.js` | STORE_ITEMS map + transaction | Yes | Yes — 8-item price map, `$transaction` callback form | Yes — mounted at `/api/kids` in index.js | VERIFIED |
| `server/src/index.js` | Rate limiter middleware | Yes | Yes — `kidAuthLimiter` with `max:10, windowMs:60*1000` | Yes — applied before `kidLookupHandler` and `kidLoginHandler` | VERIFIED |
| `server/src/services/weeklyDigest.js` | HTML entity escaping | Yes | Yes — `he.escape()` via `esc()` on all user strings; `buildEmailHtml` exported | Yes — called by `sendWeeklyDigests`; exported for tests | VERIFIED |
| `server/src/middleware/auth.js` | Production startup guard | Yes | Yes — module-load-time `throw new Error` when `NODE_ENV=production` and vars missing | Yes — loaded by `index.js` via `requireAuth` import | VERIFIED |
| `server/src/routes/progress.js` | Body field allowlist | Yes | Yes — explicit destructure of 9 known fields; `...req.body` removed | Yes — mounted at `/api/progress` in index.js | VERIFIED |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `server/src/routes/kids.js` | `STORE_ITEMS` map | `const item = STORE_ITEMS[itemId]; const price = item.price` | WIRED | Line 119-121; old `{ itemId, price } = req.body` is absent |
| `server/src/index.js` | `express-rate-limit` | `kidAuthLimiter` middleware before both kid auth handlers | WIRED | Lines 35-46; `kidAuthLimiter` appears between route handler registration |
| `server/src/services/weeklyDigest.js` | `he` library | `he.escape()` via `esc()` wrapping `kid.name`, `parentName`, and subject kid names | WIRED | Lines 4, 8-10, 66, 103, 177 |
| `server/src/middleware/auth.js` | process startup | `throw new Error` at module-load time when `NODE_ENV === 'production'` and vars missing | WIRED | Lines 7-11; fires on `require('./middleware/auth')` not on first request |
| `server/src/routes/kids.js` | `prisma.$transaction` | Interactive callback wrapping `tx.kidProfile.findUnique` + `tx.kidProfile.update` | WIRED | Lines 123-142; error catch block maps `.status` to HTTP codes |
| `server/src/routes/progress.js` | `upsertProgress` | Explicit destructured fields only (no `...req.body` spread) | WIRED | Lines 198-209; `...req.body` is absent; confirmed by grep exit:1 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 01-01-PLAN.md | Server validates item prices server-side | SATISFIED | `STORE_ITEMS` map enforced in buy handler; 4 tests pass |
| SEC-02 | 01-01-PLAN.md | Rate limiting on kid-login (10 req/min per IP) | SATISFIED | `kidAuthLimiter` applied; 3 tests pass (including 429 assertion) |
| SEC-03 | 01-02-PLAN.md | HTML entity escape in email digests | SATISFIED | `he.escape()` on all user strings; 5 tests pass |
| SEC-04 | 01-02-PLAN.md | Production startup error if Supabase vars absent | SATISFIED | Module-load-time throw in `auth.js`; 4 tests pass |
| SEC-05 | 01-02-PLAN.md | Coin purchase wrapped in Prisma transaction | SATISFIED | `$transaction` interactive callback with fresh read; 3 tests pass |
| SEC-06 | 01-02-PLAN.md | `req.body` destructured to known fields in progress route | SATISFIED | Explicit 9-field destructure replaces `...req.body`; 2 tests pass |

No orphaned requirements. REQUIREMENTS.md traceability table maps only SEC-01 through SEC-06 to Phase 1, and all 6 are claimed by the two plans and verified above.

### Anti-Patterns Found

No blockers or warnings found.

- `return null` occurrences in `kids.js` and `progress.js` are all legitimate early-exit guard clauses in access-control helpers, not stub implementations.
- `return []` on line 129 of `kids.js` is the try/catch fallback for malformed `unlockedItems` JSON — correct behavior.
- No TODO, FIXME, HACK, or placeholder comments in any of the 5 production files.
- `...req.body` spread is fully removed from `progress.js` — confirmed by grep.

### Human Verification Required

None. All security behaviors are verifiable programmatically via the automated test suite. The test run output confirms:

```
Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  727ms
```

### Gaps Summary

No gaps. All 6 security requirements are implemented, wired, and covered by passing automated tests. The test suite exits 0 with 21/21 tests passing across all 6 test files.

---

_Verified: 2026-03-19T05:15:00Z_
_Verifier: Claude (gsd-verifier)_
