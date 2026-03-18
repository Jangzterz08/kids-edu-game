# Phase 1: Security Hardening - Research

**Researched:** 2026-03-18
**Domain:** Express.js server-side security — price validation, rate limiting, input sanitization, startup guards, database transactions
**Confidence:** HIGH

## Summary

All six security requirements address concrete, audited vulnerabilities in the existing `server/src/` code. The fixes are surgical: no new architectural patterns are needed and no client-side changes are required except for SEC-01 (where the client already sends `itemId`; the server just needs to stop trusting the accompanying `price`).

The three library-level problems (SEC-01 price map, SEC-02 rate limiting, SEC-03 HTML entity escaping) each have a single standard solution in the Node/Express ecosystem. The three code-level problems (SEC-04 startup guard, SEC-05 Prisma transaction, SEC-06 body destructuring) require only targeted edits to existing files — no new dependencies needed beyond `express-rate-limit` and `he` (HTML entity encoder).

Zero test infrastructure exists today. Nyquist validation requires standing up a test runner (Vitest + Supertest for the Express server) as Wave 0 work before writing implementation. Given the zero-coverage baseline, the tests for this phase also serve as the project's foundational test harness.

**Primary recommendation:** Install `express-rate-limit@8.3.1` and `he@1.2.0`, implement all six fixes as targeted edits to existing route/middleware/service files, and write integration tests with Vitest + Supertest as Wave 0 before any implementation commit.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Server validates item prices server-side (canonical price map keyed by itemId), never trusting client-supplied price | Client `STORE_ITEMS` array already has the canonical price list; mirror it as a server-side `STORE_ITEMS` map in `kids.js` and look up price by `itemId` |
| SEC-02 | Rate limiting on kid-login (10 req/min per IP) and kid-lookup endpoints via express-rate-limit | Both endpoints are mounted as bare handlers in `index.js` lines 34–35; `express-rate-limit` middleware applies cleanly before the handler |
| SEC-03 | Kid and classroom names sanitized (HTML entity escape) before storage and rendering in email digests | `weeklyDigest.js` interpolates `kid.name` directly into HTML template strings; `he` library's `he.escape()` is the standard Node solution |
| SEC-04 | Server throws startup error in production if Supabase env vars are absent (no silent mock-user fallback) | Mock fallback is in `middleware/auth.js` lines 29–33; move the guard check to module load time so the process exits before `app.listen()` |
| SEC-05 | `unlockedItems` coin purchase wrapped in Prisma transaction to prevent lost-update race condition | `kids.js` lines 109–119 do a read-modify-write with no lock; Prisma `$transaction` with `findUnique` + `update` inside the callback is the standard pattern |
| SEC-06 | `req.body` destructured to known fields before DB upsert in progress route | `progress.js` line 199–200 spreads `...req.body` directly into `upsertProgress`; replace with explicit destructuring of only the score fields |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express-rate-limit | 8.3.1 | IP-based rate limiting middleware for Express | De-facto standard; ships with built-in memory store, zero config for simple limits |
| he | 1.2.0 | HTML entity encoding/decoding | Spec-compliant; no dependencies; used by Handlebars, marked, and most email templaters |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | SEC-04, SEC-05, SEC-06 are pure code changes | No additional deps required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| express-rate-limit | rate-limiter-flexible | `rate-limiter-flexible` is more powerful (Redis backing, sliding windows) but overkill for a single-node Railway deployment |
| he | sanitize-html | `sanitize-html` strips/allows tags — correct for user-generated HTML. For plain display names that should never contain HTML, entity-escaping is sufficient and lighter |
| he | entities | `entities` is slightly smaller but `he` is more widely audited and used |

**Installation:**
```bash
cd /Users/Ja_Jang/Application/kids-edu-game/server
npm install express-rate-limit@8.3.1 he@1.2.0
```

**Version verification:** Confirmed current as of 2026-03-18 via `npm view`.

## Architecture Patterns

### Recommended Project Structure

No structural changes. All edits are within existing files:
```
server/src/
├── index.js              # SEC-02: add rateLimit middleware before kidLookup/kidLogin handlers
├── middleware/
│   └── auth.js           # SEC-04: startup guard — throw if SUPABASE_URL/KEY absent in prod
├── routes/
│   ├── kids.js           # SEC-01: STORE_ITEMS price map + SEC-05: $transaction
│   └── progress.js       # SEC-06: destructure req.body to known fields
└── services/
    └── weeklyDigest.js   # SEC-03: he.escape() on kid.name and classroom name
```

### Pattern 1: Server-Side Price Map (SEC-01)

**What:** Define a `STORE_ITEMS` object at the top of `kids.js` keyed by `itemId`. In the buy handler, look up price from the map and ignore `req.body.price`.

**When to use:** Any endpoint where the client supplies a price or other canonical value that belongs to the server's domain.

**Example:**
```javascript
// server/src/routes/kids.js
const STORE_ITEMS = {
  frog:      { price: 30  },
  chick:     { price: 40  },
  hamster:   { price: 60  },
  panda:     { price: 80  },
  butterfly: { price: 100 },
  dragon:    { price: 120 },
  dino:      { price: 150 },
  unicorn:   { price: 200 },
};

// In the buy handler:
const { itemId } = req.body;
if (!itemId) return res.status(400).json({ error: 'itemId is required' });
const item = STORE_ITEMS[itemId];
if (!item) return res.status(400).json({ error: 'Unknown item' });
const price = item.price; // server-authoritative; ignore req.body.price
```

### Pattern 2: Express Rate Limiting (SEC-02)

**What:** Create a `RateLimiter` instance from `express-rate-limit` and apply it as middleware before the public handler.

**When to use:** Any public endpoint that accepts credentials or exposes enumeration data.

**Example:**
```javascript
// server/src/index.js
const rateLimit = require('express-rate-limit');

const kidAuthLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

app.post('/api/auth/kid-lookup', kidAuthLimiter, kidLookupHandler);
app.post('/api/auth/kid-login',  kidAuthLimiter, kidLoginHandler);
```

Note: `express-rate-limit` v7+ ships `standardHeaders: 'draft-7'` by default which sets `RateLimit-*` headers. The `legacyHeaders: false` suppresses older `X-RateLimit-*` headers.

### Pattern 3: HTML Entity Escaping (SEC-03)

**What:** Wrap user-supplied strings in `he.escape()` before interpolating into HTML template strings.

**When to use:** Any user-supplied string interpolated into an HTML context — especially email templates.

**Example:**
```javascript
// server/src/services/weeklyDigest.js
const he = require('he');

// Inside buildEmailHtml / kidCards map:
<h2 ...>${he.escape(kid.name)}</h2>
// and in the email subject line:
subject: `Weekly update for ${parent.kids.map(k => he.escape(k.name)).join(' & ')}`
```

Affected interpolation points in `weeklyDigest.js`:
- Line 61: `${kid.name}` (kid card heading)
- Line 172: `parent.kids.map(k => k.name).join(' & ')` (email subject)
- `parentName` in greeting (line 98): `Hi ${parentName}` — also needs escaping

### Pattern 4: Production Startup Guard (SEC-04)

**What:** At module load time in `auth.js`, check env vars and throw if in production. This causes the Node process to crash before `app.listen()` is called, which Railway will detect and report.

**When to use:** Any critical dependency that has a silent degraded-mode fallback.

**Example:**
```javascript
// server/src/middleware/auth.js (top of file, after require statements)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseKey)) {
  throw new Error('[Auth] SUPABASE_URL and SUPABASE_SERVICE_KEY are required in production. Server startup aborted.');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
```

The `throw` at module load time (outside any function) causes Node to exit with a non-zero code, which Railway's healthcheck detects as a failed deployment.

### Pattern 5: Prisma Transaction for Read-Modify-Write (SEC-05)

**What:** Wrap the `findUnique` + `update` pair in a `prisma.$transaction()` callback so Postgres issues a serializable read then a conditional write, preventing lost-update from concurrent requests.

**When to use:** Any sequential read-then-write on a single row where concurrent callers could interleave.

**Example:**
```javascript
// server/src/routes/kids.js — buy handler
const updated = await prisma.$transaction(async (tx) => {
  const freshKid = await tx.kidProfile.findUnique({ where: { id: kid.id } });
  if (!freshKid) throw new Error('Kid not found');

  const unlocked = (() => {
    try { return JSON.parse(freshKid.unlockedItems || '[]'); }
    catch { return []; }
  })();

  if (unlocked.includes(itemId)) throw Object.assign(new Error('Already unlocked'), { status: 400 });
  if (freshKid.coins < price) throw Object.assign(new Error('Not enough coins'), { status: 400 });

  return tx.kidProfile.update({
    where: { id: freshKid.id },
    data: {
      coins: { decrement: price },
      unlockedItems: JSON.stringify([...unlocked, itemId]),
    },
  });
});
```

The outer `kid` fetch (done before the transaction for the auth check) is still needed for ownership verification. The transaction performs a fresh re-read of the financial state inside the atomic unit.

### Pattern 6: Explicit Body Destructuring (SEC-06)

**What:** Replace `...req.body` spread with explicit destructuring of only the score fields the handler expects.

**When to use:** Any route that passes user-controlled data directly to a DB layer without an intermediate validation schema.

**Example:**
```javascript
// server/src/routes/progress.js — POST /:kidId/lesson/:lessonSlug
// BEFORE (vulnerable):
const record = await upsertProgress(kid.id, {
  lessonId: lesson.id,
  ...req.body,
});

// AFTER (safe):
const {
  viewed,
  matchScore, traceScore, quizScore, spellingScore,
  phonicsScore, patternScore, oddOneOutScore, scrambleScore,
} = req.body;

const record = await upsertProgress(kid.id, {
  lessonId: lesson.id,
  viewed,
  matchScore, traceScore, quizScore, spellingScore,
  phonicsScore, patternScore, oddOneOutScore, scrambleScore,
});
```

The field list comes from `server/prisma/schema.prisma` `LessonProgress` model — check for `scrambleScore` (added in migration `20260318000000_add_scramble_score`).

### Anti-Patterns to Avoid

- **Removing the `supabase = null` fallback entirely in dev:** The dev fallback is valuable. Only block it in `NODE_ENV === 'production'`. Keep the fallback for local development.
- **Using `sanitize-html` for display names:** Overkill — it allows/strips HTML tags. Display names should not contain HTML at all; entity-escaping is correct and sufficient.
- **Applying rate limiter globally with `app.use()`:** This would throttle authenticated API calls. Apply only to the two specific public endpoints.
- **Using Prisma `$transaction` with an array of operations instead of an interactive callback:** The array form (`prisma.$transaction([...])`) does not re-read data inside the transaction. The interactive callback form (`prisma.$transaction(async (tx) => { ... })`) is required to re-read `unlockedItems` inside the atomic unit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom `Map<IP, count>` in-process counter | express-rate-limit | Handles memory cleanup, standard headers, window reset correctly |
| HTML entity encoding | Manual `str.replace(/[&<>"']/g, ...)` | he | Covers all named entities, numeric entities, edge cases in spec |
| Database concurrency | Optimistic locking with version fields | Prisma `$transaction` interactive callback | Postgres handles serialization at the engine level; no application-level version counter needed |

**Key insight:** Each of these problems has subtle correctness requirements (IP header spoofing for rate limiters, surrogate pairs for entity encoding, phantom reads for transactions) that a hand-rolled implementation will get wrong on the first attempt.

## Common Pitfalls

### Pitfall 1: Rate Limiter Trusting `X-Forwarded-For` Without Trust Proxy
**What goes wrong:** `express-rate-limit` reads the client IP from `req.ip`. Behind Railway's reverse proxy, `req.ip` is `127.0.0.1` unless Express is told to trust the proxy — causing ALL requests to share one IP bucket.
**Why it happens:** Express does not trust `X-Forwarded-For` by default.
**How to avoid:** Add `app.set('trust proxy', 1)` in `server/src/index.js` before mounting the rate limiter. Railway forwards the real client IP in `X-Forwarded-For`.
**Warning signs:** Rate limit triggers immediately for all users in production, or never triggers despite many requests.

### Pitfall 2: Transaction Error Not Mapped to HTTP Status
**What goes wrong:** The `$transaction` callback throws a plain `Error('Already unlocked')`, which reaches the global error handler and returns 500.
**Why it happens:** The error handler at `index.js` uses `err.status || 500`. Errors thrown inside transactions don't carry `.status` automatically.
**How to avoid:** Attach `.status = 400` to thrown errors inside the transaction, or catch the specific error type after `$transaction` resolves and map it to the correct status code.
**Warning signs:** Client receives 500 for "already unlocked" or "not enough coins" conditions.

### Pitfall 3: `he.escape()` Applied to Undefined
**What goes wrong:** `he.escape(undefined)` returns `'undefined'` as a string in the email.
**Why it happens:** `kid.name` or `parent.name` can be null in the DB if never set.
**How to avoid:** Use `he.escape(kid.name || 'Your child')` as a fallback before the escape call.
**Warning signs:** Emails display the literal string "undefined" in the kid name slot.

### Pitfall 4: Startup Guard Breaks Test Environment
**What goes wrong:** Tests run in `NODE_ENV=test` but call `require('../middleware/auth')`, which now throws at module load if env vars are absent.
**Why it happens:** The guard uses `process.env.NODE_ENV === 'production'` — but if the test runner sets `NODE_ENV=test` or leaves it unset, the guard should not trigger.
**How to avoid:** Guard condition is exactly `=== 'production'` — any other value (including `test` or undefined) bypasses it. Confirm Vitest runs with `NODE_ENV=test` (it does by default).

### Pitfall 5: `unlockedItems` JSON Parse Failure in Transaction
**What goes wrong:** If `unlockedItems` is malformed JSON (already flagged as a fragile area), the `JSON.parse` inside the transaction throws an unhandled error.
**Why it happens:** No try/catch guard exists on the server-side parse (only on the client). This is a pre-existing fragile area noted in CONCERNS.md.
**How to avoid:** Wrap the `JSON.parse` inside the transaction in a try/catch that falls back to `[]`. This is a good opportunity to fix the pre-existing fragility as part of SEC-05.

## Code Examples

Verified patterns from official sources:

### express-rate-limit Basic Setup
```javascript
// Source: https://express-rate-limit.mintlify.app/reference/configuration
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,  // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
});
```

### he.escape Usage
```javascript
// Source: https://github.com/mathiasbynens/he#heescapetext
const he = require('he');
he.escape('<script>alert("xss")</script>');
// => '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
he.escape('Emma & Luca');
// => 'Emma &amp; Luca'
```

### Prisma Interactive Transaction
```javascript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
const result = await prisma.$transaction(async (tx) => {
  const record = await tx.someModel.findUnique({ where: { id } });
  // perform conditional logic on `record`
  return tx.someModel.update({ where: { id }, data: { ... } });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom rate-limit middleware | express-rate-limit | Always the standard | No change needed |
| `res.set('X-RateLimit-*')` headers | `RateLimit-*` (IETF draft-7) | express-rate-limit v7 | Use `standardHeaders: true, legacyHeaders: false` |
| Prisma batch transaction array | Interactive transaction callback | Prisma v4+ | Array form cannot do conditional reads; callback required for read-modify-write |

**Deprecated/outdated:**
- `express-rate-limit` v6 and below: the `draft-6` header format is deprecated. v8 ships `draft-7` headers automatically with `standardHeaders: true`.

## Open Questions

1. **Should the buy endpoint also return an error if `itemId` is valid but the price field is supplied and doesn't match?**
   - What we know: SEC-01 requires the server to ignore client price. Sending a 400 on price mismatch would break current client silently.
   - What's unclear: Whether to silently ignore or explicitly reject a mismatched `price` field.
   - Recommendation: Silently ignore — the client sends `price` for its own UX purposes (pre-check). Rejecting it would require a client change. The requirement is about never trusting it, not about rejecting it.

2. **Rate limiter storage: in-memory vs. Redis**
   - What we know: Railway is single-instance; in-memory store works correctly today.
   - What's unclear: If Railway scales to multiple instances, in-memory rate limits are per-instance (each instance allows 10 req/min rather than 10 total).
   - Recommendation: In-memory is correct for now. Document as a known limitation. Redis upgrade is a Phase 4+ concern when monetization drives traffic growth.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + Supertest 7.x |
| Config file | `server/vitest.config.js` — does not exist yet (Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose tests/security/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | POST `/api/kids/:id/store/buy` with arbitrary price (e.g. `price: 0`) deducts canonical price, not client price | integration | `npx vitest run tests/security/sec01-price-validation.test.js` | Wave 0 |
| SEC-01 | POST with unknown `itemId` returns 400 | integration | same file | Wave 0 |
| SEC-02 | 11th POST to `/api/auth/kid-login` within 60s returns 429 | integration | `npx vitest run tests/security/sec02-rate-limit.test.js` | Wave 0 |
| SEC-02 | 11th POST to `/api/auth/kid-lookup` within 60s returns 429 | integration | same file | Wave 0 |
| SEC-03 | `buildEmailHtml` with `kid.name = '<script>x</script>'` produces escaped output | unit | `npx vitest run tests/security/sec03-sanitization.test.js` | Wave 0 |
| SEC-03 | `kid.name` containing `&` appears as `&amp;` in rendered HTML | unit | same file | Wave 0 |
| SEC-04 | `require('../middleware/auth')` with `NODE_ENV=production` and missing env vars throws synchronously | unit | `npx vitest run tests/security/sec04-startup-guard.test.js` | Wave 0 |
| SEC-05 | Concurrent buy requests for same item result in exactly one unlock and correct final coin balance | integration | `npx vitest run tests/security/sec05-transaction.test.js` | Wave 0 |
| SEC-06 | POST `/api/progress/:kidId/lesson/:slug` with `req.body` containing extra field (e.g. `kidId: 'other'`) does not propagate extra field to DB | integration | `npx vitest run tests/security/sec06-body-destructure.test.js` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/security/` (runs only phase-relevant tests, < 10s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/vitest.config.js` — Vitest config for Node/CommonJS environment
- [ ] `server/tests/helpers/setup.js` — test DB seeding helpers (mock Prisma or test DB)
- [ ] `server/tests/security/sec01-price-validation.test.js` — covers SEC-01
- [ ] `server/tests/security/sec02-rate-limit.test.js` — covers SEC-02
- [ ] `server/tests/security/sec03-sanitization.test.js` — covers SEC-03
- [ ] `server/tests/security/sec04-startup-guard.test.js` — covers SEC-04
- [ ] `server/tests/security/sec05-transaction.test.js` — covers SEC-05
- [ ] `server/tests/security/sec06-body-destructure.test.js` — covers SEC-06
- [ ] Framework install: `cd server && npm install --save-dev vitest@3 supertest@7`

**Test strategy note:** The server is CommonJS (`"type": "commonjs"`). Vitest supports CommonJS via `environment: 'node'` in config. For integration tests, Supertest wraps the Express `app` export from `index.js` directly — no port binding needed. For SEC-04, the test must unset env vars and re-require the module in a fresh module context (use `vi.resetModules()` before each test).

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `server/src/routes/kids.js`, `progress.js`, `auth.js`, `middleware/auth.js`, `index.js`, `services/weeklyDigest.js`
- `server/package.json` — existing dependency versions confirmed
- `npm view express-rate-limit version` → `8.3.1` (verified 2026-03-18)
- `npm view he version` → `1.2.0` (verified 2026-03-18)

### Secondary (MEDIUM confidence)
- express-rate-limit documentation at https://express-rate-limit.mintlify.app — configuration options and header behavior
- Prisma documentation on interactive transactions — `$transaction(async (tx) => ...)` pattern
- `he` library README — https://github.com/mathiasbynens/he — `he.escape()` behavior with edge cases

### Tertiary (LOW confidence)
- None — all claims are verifiable from the audited source files or official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions npm-verified; libraries are long-established
- Architecture: HIGH — based on direct code inspection; no inference needed
- Pitfalls: HIGH (Pitfall 1–3) / MEDIUM (Pitfall 4–5) — trust-proxy and transaction error mapping are confirmed Express/Prisma behaviors; test env and JSON parse issues are inferred from code patterns

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable libraries; no fast-moving dependencies in scope)
