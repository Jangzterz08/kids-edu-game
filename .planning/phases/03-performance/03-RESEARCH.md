# Phase 3: Performance - Research

**Researched:** 2026-03-20
**Domain:** Node.js/Express backend — Prisma 7 query consolidation, DB transaction wrapping, async batching
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | `GET /api/kids/:id/home-summary` endpoint aggregates all KidHome data (progress, achievements, classrooms, daily challenge) into one response | Prisma 7 `Promise.all` parallel queries; new Express route in `kids.js` |
| PERF-02 | `progressSync.upsertProgress` wrapped in single Prisma `$transaction` (reduce 3–4 sequential round-trips to 1) | Prisma 7 interactive transaction (`$transaction(async tx => {...})`); existing pattern at `kids.js:123` |
| PERF-03 | Stats endpoint (`/api/progress/:kidId/stats`) refactored to single query (eliminate second full-table scan) | Second `prisma.module.findMany` at line 130 of `progress.js` re-uses data already loaded; can fold into single query |
| PERF-04 | Weekly digest sends batched with `Promise.allSettled` in groups of 10 parents | Current `for...of` loop in `weeklyDigest.js:167` is fully serial; replace with chunk-based `Promise.allSettled` |
</phase_requirements>

---

## Summary

Phase 3 is a pure backend performance pass with no new libraries, no schema migrations, and no client changes. Every requirement maps to an existing file with a clear, contained change.

**PERF-01** is the largest change: KidHome currently fires 4+ network requests on mount (progress, achievements, classrooms, daily-challenge, plus a `refreshKids` call for streak/coins). A new `GET /api/kids/:id/home-summary` endpoint consolidates all four DB queries into one parallel `Promise.all`, returns a single JSON response, and the KidHome component is updated to call only that one endpoint.

**PERF-02** targets `progressSync.upsertProgress`, which currently executes 4–6 sequential `await prisma.*` calls (findUnique → upsert → two conditional updates → findUnique → conditional update). Wrapping all of these in a single `prisma.$transaction(async tx => {...})` eliminates round-trip latency between calls and makes the whole operation atomic.

**PERF-03** is a one-query fix: `GET /api/progress/:kidId/stats` at line 130 of `progress.js` fires a second full `prisma.module.findMany` with nested progress joins — identical to what the first query already loaded. The fix is to fetch both datasets in a single `Promise.all` and reuse the module data.

**PERF-04** changes the weekly digest loop from serial (`for...of parent of parents`) to parallel batches of 10 using `Promise.allSettled`. No third-party library needed — Node.js built-in.

**Primary recommendation:** All four requirements are in-place refactors of existing files. No new packages needed. Use the existing `prisma.$transaction(async tx => {...})` pattern already established in `kids.js:123`.

---

## Standard Stack

### Core — Already Installed

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@prisma/client` | 7.4.2 | ORM + `$transaction` API | Interactive transactions confirmed working in codebase (kids.js:123) |
| `@prisma/adapter-pg` | 7.4.2 | Supabase session-mode pooler | Already in use; no changes needed |
| `express` | 5.2.1 | Route handler for new `/home-summary` | Adding one new route to existing `kids.js` |
| `resend` | 6.9.3 | Email sending in digest | No changes to Resend calls; only loop structure changes |
| `node-cron` | 4.2.1 | Weekly digest scheduler | No changes |

**No new packages required for this phase.**

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Promise.allSettled` (built-in) | `p-limit` or `bottleneck` | Third-party concurrency libs add dependency; `Promise.allSettled` with chunk array is sufficient for 10-at-a-time batching |
| Prisma interactive `$transaction(async tx)` | Sequential queries with manual rollback | Sequential is already the bug — transaction is the correct fix |
| Single aggregated endpoint | GraphQL / tRPC | Premature architecture change; REST endpoint is consistent with existing patterns |

**Installation:** None required.

---

## Architecture Patterns

### Recommended Structure (no changes to folder structure)

```
server/src/
├── routes/
│   ├── kids.js          # Add GET /:kidId/home-summary endpoint (PERF-01)
│   └── progress.js      # Fix stats query (PERF-03), minor fix to lesson POST (PERF-02 upstream)
├── services/
│   ├── progressSync.js  # Wrap upsertProgress in $transaction (PERF-02)
│   └── weeklyDigest.js  # Batch send loop with Promise.allSettled (PERF-04)
```

---

### Pattern 1: Prisma Interactive Transaction (PERF-02)

**What:** Wrap all sequential Prisma operations in a single `$transaction(async tx => {...})`. All calls use `tx` instead of `prisma`. On error, all writes roll back automatically.

**When to use:** When multiple DB operations must be atomic AND sequential-ordering within the transaction matters (e.g., read-then-conditionally-write).

**Current code (progressSync.js) — 6 sequential round-trips:**
```javascript
// BEFORE — 6 separate network round-trips to DB
const existing = await prisma.lessonProgress.findUnique({...});   // RT 1
const record   = await prisma.lessonProgress.upsert({...});       // RT 2
await prisma.kidProfile.update({ data: { totalStars: ... } });    // RT 3 (conditional)
await prisma.kidProfile.update({ data: { coins: ... } });         // RT 4 (conditional)
const kidData  = await prisma.kidProfile.findUnique({...});       // RT 5
await prisma.kidProfile.update({ data: { currentStreak: ... } }); // RT 6 (conditional)
```

**Target code — 1 transaction, same round-trips but atomic:**
```javascript
// AFTER — single $transaction; all ops inside tx scope
const result = await prisma.$transaction(async (tx) => {
  const existing = await tx.lessonProgress.findUnique({...});

  const record = await tx.lessonProgress.upsert({...});

  // Combine the two kidProfile.update calls into one if both fields changed
  const starDelta  = finalStars - (existing?.starsEarned ?? 0);
  const coinsDelta = starDelta > 0 ? starDelta * 5 : 3;
  if (starDelta > 0 || coinsDelta > 0) {
    await tx.kidProfile.update({
      where: { id: kidId },
      data: {
        ...(starDelta  > 0 && { totalStars: { increment: starDelta  } }),
        ...(coinsDelta > 0 && { coins:      { increment: coinsDelta } }),
      },
    });
  }

  // Streak update
  const kidData = await tx.kidProfile.findUnique({...});
  // ...streak logic...
  return { ...record, coinsDelta };
});
```

**Source:** Prisma 7 docs — interactive transactions. Pattern already used in `server/src/routes/kids.js:123`.

**Key detail:** The two separate `kidProfile.update` calls for stars and coins can be merged into one `update` with a conditional spread. This reduces from 6 to 4 sequential calls inside the transaction (findUnique LP → upsert LP → update KP → findUnique KP → conditional update KP).

---

### Pattern 2: Parallel Query Aggregation (PERF-01, PERF-03)

**What:** Replace sequential `await` calls that are independent with `Promise.all([...])`. Results arrive as a destructured array in one await.

**When to use:** When queries are independent (no output of query A is input to query B).

**Example — new home-summary endpoint:**
```javascript
// GET /api/kids/:kidId/home-summary
router.get('/:kidId/home-summary', async (req, res, next) => {
  try {
    // Auth check (sequential — needed first)
    const kid = await resolveKidAccess(req, req.params.kidId);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);

    // All 4 data fetches run in parallel
    const [modules, achievements, enrollments, dailyChallenge] = await Promise.all([
      prisma.module.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            include: { progress: { where: { kidId: kid.id } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.achievement.findMany({
        where: { kidId: kid.id },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.classroomStudent.findMany({
        where: { kidId: kid.id },
        include: { classroom: { select: { id: true, name: true } } },
      }),
      prisma.dailyChallenge.findUnique({
        where: { kidId_date: { kidId: kid.id, date: today } },
      }),
    ]);

    // Shape the progress data (same logic as existing /:kidId route)
    const progress = modules.map(mod => ({
      moduleSlug: mod.slug,
      title: mod.title,
      iconEmoji: mod.iconEmoji,
      lessonsTotal: mod.lessons.length,
      lessonsCompleted: mod.lessons.filter(l => l.progress[0]?.starsEarned > 0).length,
      starsEarned: mod.lessons.reduce((sum, l) => sum + (l.progress[0]?.starsEarned ?? 0), 0),
      maxStars: mod.lessons.length * 3,
    }));

    res.json({
      kid: {
        id: kid.id,
        name: kid.name,
        avatarId: kid.avatarId,
        totalStars: kid.totalStars,
        currentStreak: kid.currentStreak,
        coins: kid.coins,
      },
      progress,
      achievements,
      classrooms: enrollments.map(e => e.classroom),
      dailyChallenge: {
        moduleSlug: getChallengeSlug(),  // pure function, no DB
        completedAt: dailyChallenge?.completedAt || null,
        coinsEarned: dailyChallenge?.coinsEarned || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});
```

**PERF-03 — stats endpoint: merge the second module query:**
```javascript
// BEFORE — two separate findMany calls (lines 93 and 130 in progress.js)
const allProgress = await prisma.lessonProgress.findMany({...});      // query 1
// ... JS-side aggregation ...
const modules = await prisma.module.findMany({...include: progress}); // query 2 (redundant!)

// AFTER — single Promise.all, modules fetched once
const [allProgress, modules] = await Promise.all([
  prisma.lessonProgress.findMany({ where: { kidId: kid.id }, select: { ... } }),
  prisma.module.findMany({ orderBy: { sortOrder: 'asc' }, include: { lessons: { include: { progress: { where: { kidId: kid.id } } } } } }),
]);
// same JS-side aggregation logic unchanged
```

---

### Pattern 3: Batched Promise.allSettled (PERF-04)

**What:** Chunk an array into groups of N and run each group concurrently. `Promise.allSettled` (not `Promise.all`) prevents one failure from cancelling the rest of the batch.

**When to use:** Fan-out operations where individual failure must not block others (email sending, notifications).

**Current code (weeklyDigest.js:167) — fully serial:**
```javascript
// BEFORE — each parent blocks the next
for (const parent of parents) {
  if (!parent.kids.length) continue;
  try {
    const kidsStats = await Promise.all(parent.kids.map(k => getKidWeeklyStats(k.id)));
    const html = buildEmailHtml(parent.name, kidsStats);
    await resend.emails.send({...});
    sent++;
  } catch (err) {
    failed++;
  }
}
```

**Target code — 10-at-a-time batches:**
```javascript
// AFTER — 10 parents processed concurrently per batch
const activeParents = parents.filter(p => p.kids.length > 0);
const BATCH_SIZE = 10;

for (let i = 0; i < activeParents.length; i += BATCH_SIZE) {
  const batch = activeParents.slice(i, i + BATCH_SIZE);

  const results = await Promise.allSettled(
    batch.map(async (parent) => {
      const kidsStats = await Promise.all(parent.kids.map(k => getKidWeeklyStats(k.id)));
      const html = buildEmailHtml(parent.name, kidsStats);
      await resend.emails.send({
        from: FROM,
        to: parent.email,
        subject: `...`,
        html,
      });
      return parent.email;
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      sent++;
      console.log(`[digest] Sent to ${result.value}`);
    } else {
      failed++;
      console.error(`[digest] Failed:`, result.reason?.message);
    }
  }
}
```

**Why `allSettled` not `all`:** One bad email address must not stop the other 9 in the batch from sending.

**Why 10:** Resend free tier limit is 100 emails/day; batches of 10 provide controlled concurrency without overwhelming the rate limit or the Supabase connection pool.

---

### Pattern 4: KidHome Client Update (PERF-01 client side)

**What:** Replace 4+ parallel `useEffect` API calls with a single call to the new `home-summary` endpoint.

**Current KidHome.jsx useEffect — 4+ separate API calls:**
```javascript
// Lines 64–87 of KidHome.jsx — fires 4 requests on mount
api.get(`/api/progress/${activeKid.id}`)
api.get(`/api/achievements/${activeKid.id}`)
api.get(`/api/kids/me/classrooms`)
refreshKids()  // internally calls /api/kids
api.get(`/api/daily-challenge/${activeKid.id}`)
```

**Target KidHome.jsx useEffect — single call:**
```javascript
useEffect(() => {
  if (!activeKid) return;
  api.get(`/api/kids/${activeKid.id}/home-summary`)
    .then(data => {
      setProgressData(data.progress || []);
      setAchievements(data.achievements || []);
      setHasClassroom((data.classrooms || []).length > 0);
      setStreak(data.kid.currentStreak || 0);
      setCoins(data.kid.coins || 0);
      setDailyChallenge(data.dailyChallenge);
    })
    .catch(() => {});
}, [activeKid?.id]);
```

**Note:** `refreshKids` (which calls `/api/kids`) is used by other parts of the app (KidContext). The home-summary endpoint embeds the kid's current state directly, so `refreshKids` is removed only from the KidHome mount effect, not from the app globally.

---

### Anti-Patterns to Avoid

- **Splitting the $transaction across try/catch blocks:** The streak update in `progressSync.js` currently has its own try/catch that swallows errors silently. Inside a `$transaction`, a thrown error in the streak block will roll back the entire transaction. Move the streak update inside the transaction body and handle the "non-critical" nature by structuring the transaction so streak failure is recoverable — or keep streak update outside the transaction as a separate non-critical step.
- **Merging queries that need different access control:** The home-summary endpoint must perform the same `resolveKidAccess` auth check as the individual endpoints before firing parallel queries.
- **Setting BATCH_SIZE too high for Resend:** Resend's free tier is 100 emails/day. The concurrency of the batch affects their rate limiting. Start at 10, do not raise without verifying Resend plan limits.
- **Using `Promise.all` instead of `Promise.allSettled` for email sends:** `Promise.all` fails fast — one Resend error aborts the entire batch. `Promise.allSettled` is mandatory here.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic multi-table update | Manual read-check-write with error handling | `prisma.$transaction(async tx => {...})` | Prisma handles rollback, isolation, and retry automatically |
| Concurrency control for email batches | Custom queue or worker threads | `Promise.allSettled` with chunk loop | Sufficient for ~10s-100s of parents; no extra lib needed |
| Response aggregation | Separate aggregation service or cache layer | New Express route with `Promise.all` | Direct DB queries are fast enough at current scale; caching is premature |

**Key insight:** All four requirements are straightforward code changes in existing files. The risk is misidentifying what should be inside vs. outside the transaction, not the pattern itself.

---

## Common Pitfalls

### Pitfall 1: Streak Block Breaks the Transaction

**What goes wrong:** The streak update in `progressSync.upsertProgress` has its own try/catch (lines 69–93). If you move this block inside `prisma.$transaction`, an error in streak logic will roll back the `lessonProgress.upsert` and `kidProfile.update` too — causing the entire lesson save to fail silently.

**Why it happens:** The original code explicitly marks streak as "non-critical — don't fail the whole progress save". This intent conflicts with wrapping everything in a single atomic transaction.

**How to avoid:** Two valid approaches:
1. Keep streak update **outside** the transaction as a separate step. The transaction covers `lessonProgress` upsert + `kidProfile` stars/coins update. Streak runs after, still with its own try/catch.
2. Keep streak inside the transaction but remove the try/catch — treat streak failure as transaction-fatal (simpler, but a DB error on streak now loses the lesson save too).

**Recommendation:** Option 1. The transaction covers the high-value writes (stars, coins, lesson record). Streak remains a best-effort non-critical follow-up.

### Pitfall 2: Combining Two kidProfile.update Calls Loses One Update

**What goes wrong:** The current code has two separate `prisma.kidProfile.update` calls — one for `totalStars` and one for `coins`. If you try to combine them into one call using `data: { totalStars: ..., coins: ... }`, the conditional logic (only update stars if `starDelta > 0`) must be preserved.

**Why it happens:** Using `{ increment: 0 }` is safe in Prisma but wastes a write. The real trap is accidentally losing the `starDelta > 0` guard when merging.

**How to avoid:**
```javascript
// Safe merge pattern — only write the fields that changed
const dataUpdate = {};
if (starDelta  > 0) dataUpdate.totalStars = { increment: starDelta  };
if (coinsDelta > 0) dataUpdate.coins      = { increment: coinsDelta };
if (Object.keys(dataUpdate).length > 0) {
  await tx.kidProfile.update({ where: { id: kidId }, data: dataUpdate });
}
```

### Pitfall 3: home-summary Endpoint Returns Stale Kid Profile

**What goes wrong:** The home-summary endpoint includes kid profile fields (`coins`, `streak`, `totalStars`) from the `resolveKidAccess` result. But `resolveKidAccess` fetches the kid before the parallel queries run. If the kid's data was just updated by a lesson save, the values are fresh enough. However, if `refreshKids` was called to get streak after a lesson, removing it from KidHome removes that freshness mechanism.

**Why it happens:** KidHome previously called `refreshKids()` specifically to get the post-lesson streak count. The home-summary endpoint is only called on mount, not after a lesson is saved.

**How to avoid:** The home-summary endpoint is for page load only. After a lesson completes, the client already receives the updated `streakCount` and `coinsDelta` in the lesson POST response. The home-summary endpoint does not replace that — it only replaces the mount-time parallel fetches.

### Pitfall 4: stats Endpoint Loses the Weekly Activity Data

**What goes wrong:** `GET /api/progress/:kidId/stats` uses `allProgress` (fetched first with `select`) for weekly activity. If you try to derive weekly activity from the `modules` query (which includes `lessonProgress` via `include`), you lose the `updatedAt` timestamps — the module include doesn't select that field.

**Why it happens:** The two queries have different shapes. The `allProgress` query selects `updatedAt`; the `modules` query includes progress but only for star counting.

**How to avoid:** Keep both queries in the `Promise.all`. The fix for PERF-03 is to run them **concurrently** (not sequentially), not to merge them into one. The second query's data replaces the "recommended" module logic. Both queries remain but fire in parallel.

```javascript
// CORRECT for PERF-03 — parallel, not merged
const [allProgress, modules] = await Promise.all([
  prisma.lessonProgress.findMany({ where: { kidId: kid.id }, select: { /* includes updatedAt */ } }),
  prisma.module.findMany({ orderBy: ..., include: { lessons: { include: { progress: { where: { kidId: kid.id } } } } } }),
]);
// Then use allProgress for weekly activity + accuracy stats
// Use modules for recommended module logic
```

### Pitfall 5: home-summary Includes Too Much Data

**What goes wrong:** The modules query with nested lessons and progress can be heavy for kids with all 13 modules. At 117 lessons, each with a progress row, this is still only ~117 rows — manageable. But adding more includes (e.g., lesson details like `word`, `imageFile`, `audioFile`) would over-fetch.

**How to avoid:** The home-summary endpoint needs only what KidHome displays: module-level progress aggregates. Lessons should NOT be expanded beyond what's needed for `lessonsCompleted` and `starsEarned`. The module query selects `lessons.progress` for aggregation only.

---

## Code Examples

### Verified Pattern: Interactive Transaction (Prisma 7)

Already used in this codebase at `server/src/routes/kids.js:123`:

```javascript
// Source: server/src/routes/kids.js lines 123-143
const updated = await prisma.$transaction(async (tx) => {
  const freshKid = await tx.kidProfile.findUnique({ where: { id: kid.id } });
  if (!freshKid) throw Object.assign(new Error('Kid not found'), { status: 404 });

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

**Key:** `tx` is the transaction client — use `tx.*` not `prisma.*` inside the callback. Throwing inside the callback auto-rolls back.

### Verified Pattern: Promise.allSettled Chunk Loop

```javascript
// Standard chunk helper — no dependency needed
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Usage in weeklyDigest.js
for (const batch of chunk(activeParents, 10)) {
  const results = await Promise.allSettled(batch.map(sendToParent));
  for (const r of results) {
    if (r.status === 'fulfilled') sent++;
    else { failed++; console.error('[digest] Failed:', r.reason?.message); }
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Sequential `await` per query | `Promise.all` for independent queries | Latency = max(queries) not sum(queries) |
| Individual writes outside transaction | `prisma.$transaction(async tx)` | Atomic + fewer round-trips |
| Serial `for...of` email loop | `Promise.allSettled` + chunk | Digest cron time: O(N) → O(N/10) |

**No deprecated APIs in use.** Prisma 7's interactive transaction API (`$transaction(async callback)`) is the current stable form. The sequential array transaction form (`$transaction([p1, p2, ...])`) is an alternative but does not support read-then-write patterns needed for PERF-02.

---

## Open Questions

1. **Transaction isolation level for PERF-02**
   - What we know: Prisma 7's `$transaction` defaults to PostgreSQL `READ COMMITTED` isolation. The existing coin-purchase transaction (SEC-05) uses this successfully.
   - What's unclear: Whether `upsertProgress` needs `SERIALIZABLE` to prevent double-write races (two simultaneous lesson completions for same kid+lesson). The `@@unique([kidId, lessonId])` constraint on `LessonProgress` means a second concurrent upsert will either succeed with updated scores or fail with a constraint error inside the transaction.
   - Recommendation: `READ COMMITTED` is sufficient. The `upsert` semantic handles concurrent writes — last writer wins on score fields, which is acceptable for lesson saves.

2. **getChallengeSlug in home-summary**
   - What we know: `getChallengeSlug()` is currently in `server/src/routes/dailyChallenge.js`. The home-summary endpoint needs it.
   - What's unclear: Whether to copy the function, move it to a shared utility, or import from the route module.
   - Recommendation: Extract `getChallengeSlug()` and `todayDate()` to a small shared utility file (`server/src/lib/dailyChallenge.js`) and import from both `dailyChallenge.js` route and the new home-summary endpoint. Avoids duplication.

3. **Resend rate limits with 10-at-a-time batching**
   - What we know: Resend free tier is 100 emails/day. Pro tier (from $20/mo) has higher limits. Current user count is small — monitoring page is at resend.com/dashboard.
   - What's unclear: Exact burst rate limit per second for concurrent sends.
   - Recommendation: Batch size of 10 is conservative. If Resend errors appear, reduce to 5. Log all failures with parent email for retry.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd server && npx vitest run tests/performance/` |
| Full suite command | `cd server && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERF-01 | `GET /api/kids/:id/home-summary` returns `{ kid, progress, achievements, classrooms, dailyChallenge }` in single response | unit | `cd server && npx vitest run tests/performance/perf01-home-summary.test.js` | ❌ Wave 0 |
| PERF-02 | `upsertProgress` called once triggers `$transaction` wrapping all DB writes | unit | `cd server && npx vitest run tests/performance/perf02-transaction.test.js` | ❌ Wave 0 |
| PERF-03 | `GET /api/progress/:kidId/stats` calls `prisma.module.findMany` exactly once (not twice) | unit | `cd server && npx vitest run tests/performance/perf03-stats-query.test.js` | ❌ Wave 0 |
| PERF-04 | `sendWeeklyDigests` with 25 parents calls `resend.emails.send` in batches (not sequentially blocking) | unit | `cd server && npx vitest run tests/performance/perf04-digest-batch.test.js` | ❌ Wave 0 |

### Testing Strategy Notes

The existing test pattern (from Phase 1) uses:
- `vi.mock('../../src/lib/db', () => mockPrisma)` — mock the entire Prisma module
- `vi.fn()` on individual model methods
- `supertest` for HTTP-level assertions

**For PERF-02**, the key assertion is that `prisma.$transaction` is called once and all DB writes happen via `tx` (the transaction client passed into the callback). Mock `prisma.$transaction` to capture and execute the callback with a transaction mock object.

**For PERF-03**, assert `prisma.module.findMany` spy call count equals 1 (not 2) per request to `/stats`.

**For PERF-04**, mock `resend.emails.send` and assert it is called concurrently within each batch (not awaited sequentially). Verify `Promise.allSettled` semantics by making one send reject and asserting the others still resolved.

### Sampling Rate

- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/performance/`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/performance/perf01-home-summary.test.js` — covers PERF-01
- [ ] `server/tests/performance/perf02-transaction.test.js` — covers PERF-02
- [ ] `server/tests/performance/perf03-stats-query.test.js` — covers PERF-03
- [ ] `server/tests/performance/perf04-digest-batch.test.js` — covers PERF-04

No new framework install needed — Vitest, supertest, and vi.fn() infrastructure already exists.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase audit — `server/src/services/progressSync.js`, `routes/kids.js`, `routes/progress.js`, `services/weeklyDigest.js`, `pages/KidHome.jsx` read and analyzed line-by-line
- `server/src/routes/kids.js:123` — working `prisma.$transaction(async tx => {...})` pattern, confirmed functional from Phase 1 SEC-05
- `server/package.json` — confirmed Prisma 7.4.2, Resend 6.9.3, node-cron 4.2.1, Vitest 3.2.4
- `server/prisma/schema.prisma` — confirmed `@@unique([kidId, lessonId])` constraint on `LessonProgress`

### Secondary (MEDIUM confidence)

- Prisma 7 interactive transaction documentation — `$transaction(async callback)` form is stable API; `READ COMMITTED` default isolation confirmed in Prisma docs as of 2025
- `Promise.allSettled` — MDN Web Docs; available in Node.js ≥ 12.9.0; server requires Node ≥ 20 (confirmed in package.json engines)

### Tertiary (LOW confidence)

- Resend free tier daily limit (100/day) — from Resend pricing page, subject to change; verify at resend.com/pricing before hardcoding batch size assumptions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and in use; no new packages
- Architecture: HIGH — patterns verified from existing working code in the same codebase
- Pitfalls: HIGH — identified from direct line-by-line reading of the code being changed
- Test strategy: HIGH — existing test infrastructure confirmed; pattern identical to Phase 1 tests

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (Prisma 7 API is stable; no fast-moving dependencies)
