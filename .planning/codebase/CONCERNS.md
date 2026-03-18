# Codebase Concerns

**Analysis Date:** 2026-03-18

---

## Security Considerations

**CoinStore price supplied by client, not validated server-side:**
- Risk: A user can POST any `price` value (including 0 or negative) to buy items for free.
- Files: `server/src/routes/kids.js` (line 106–111), `client/src/pages/CoinStore.jsx` (lines 7–16)
- Current mitigation: Server checks `kid.coins < price` but trusts the `price` value from `req.body`.
- Recommendation: Define a canonical `STORE_ITEMS` map on the server keyed by `itemId` and look up the price there. Reject any request where the client-supplied price does not match the server's known price.

**CORS allows all `*.vercel.app` subdomains:**
- Risk: Any project deployed to Vercel can make authenticated requests to the Railway API.
- Files: `server/src/index.js` (line 18)
- Current mitigation: None beyond domain suffix check.
- Recommendation: Pin the exact Vercel deployment URL in `ALLOWED_ORIGINS` env var instead of relying on the suffix wildcard.

**CORS allows requests with no `Origin` header:**
- Risk: `curl`, Postman, or any non-browser script can hit authenticated endpoints without origin restriction.
- Files: `server/src/index.js` (line 17)
- Current mitigation: JWT auth still required for protected routes — this is an acceptable tradeoff for mobile apps.
- Recommendation: Document this intent explicitly; acceptable as-is given JWT requirement.

**Supabase fallback to mock user when env vars are absent:**
- Risk: If `SUPABASE_URL`/`SUPABASE_SERVICE_KEY` are accidentally unset in production, all requests are served as `mock-user-id`.
- Files: `server/src/middleware/auth.js` (lines 7, 29–33)
- Current mitigation: A `console.warn` fires, but the server continues serving requests.
- Recommendation: In production (`NODE_ENV === 'production'`), throw a startup error if Supabase env vars are missing rather than silently degrading.

**`req.body` spread directly into progress upsert:**
- Risk: A client can inject unexpected fields (e.g. `kidId`, `lessonId`, `starsEarned`) directly into the DB upsert without server-side schema validation.
- Files: `server/src/routes/progress.js` (line 199–200)
- Current mitigation: Prisma will reject unknown schema fields; Prisma's `select`/`where` clauses limit blast radius.
- Recommendation: Destructure only known fields from `req.body` before passing to `upsertProgress`.

**No rate limiting on public kid-login endpoint:**
- Risk: PIN brute-force is possible — PINs are 4–6 digits, meaning at most 999,999 combinations. No lockout or throttle exists.
- Files: `server/src/index.js` (lines 34–35), `server/src/routes/auth.js` (lines 101–134)
- Current mitigation: bcrypt adds ~100ms per comparison.
- Recommendation: Add `express-rate-limit` to `/api/auth/kid-login` (e.g., 10 req/min per IP) and consider account lockout after N failures.

**No rate limiting on kid-lookup endpoint:**
- Risk: `/api/auth/kid-lookup` is public and accepts any name string — it exposes which kid names have PINs set.
- Files: `server/src/index.js` (line 34), `server/src/routes/auth.js` (lines 79–98)
- Current mitigation: Only returns `id`, `name`, `avatarId` — no PINs or parent data.
- Recommendation: Add rate limiting; consider requiring the kid's age group or first letter of parent name as a secondary factor.

**`unlockedItems` stored as a JSON string in a TEXT column:**
- Risk: Concurrent writes (e.g. two tabs buying simultaneously) could corrupt the JSON or cause a lost-update race.
- Files: `server/src/routes/kids.js` (lines 109–117), DB column `KidProfile.unlockedItems`
- Current mitigation: Sequential read-modify-write with no transaction or optimistic lock.
- Recommendation: Migrate `unlockedItems` to a proper join table, or wrap the read-modify-write in a Prisma `$transaction`.

---

## Tech Debt

**Adaptive learning tables created but never used:**
- Issue: Migration `20260313180422_adaptive_learning_phase1` created `ModuleDifficulty`, `ReviewSchedule`, and `difficultyLevel` on `LessonProgress`, but zero application code reads or writes these tables.
- Files: `server/prisma/migrations/20260313180422_adaptive_learning_phase1/migration.sql`
- Impact: Dead schema weight; misleads future developers about what features exist.
- Fix approach: Either implement the adaptive logic (difficulty adjustment based on score history) or drop the tables and columns in a cleanup migration.

**`logicModule` placed first in registry with a dev comment:**
- Issue: `client/src/data/index.js` line 16 reads `// Placed first so it shows prominently during development`. This comment and ordering leaked to production.
- Files: `client/src/data/index.js`
- Impact: Minor UX issue — "Logic" appears as the top subject instead of a natural sort order.
- Fix approach: Remove the comment; decide on a final sort order (e.g., by curriculum progression or alphabetically) and update `logicModule`'s position accordingly.

**`signUpWithEmail` uses a 500ms `setTimeout` to wait for Supabase auth propagation:**
- Issue: A hardcoded 500ms delay is used after `supabase.auth.signUp()` before calling `/api/auth/register` to allow the session to propagate.
- Files: `client/src/context/AuthContext.jsx` (line 61)
- Impact: Fragile — on slow networks or Supabase cold starts the delay may not be enough; on fast connections it's wasted latency.
- Fix approach: Poll `supabase.auth.getSession()` in a short loop until a non-null session is present, or listen to the `SIGNED_IN` event before proceeding.

**`refreshKids` has an unstable identity in `useCallback` due to `activeKid` dependency:**
- Issue: `refreshKids` in `KidContext` depends on `activeKid` in its closure. Every time `activeKid` changes, a new function reference is created, which can silently cause re-renders or `useEffect` dependency loops.
- Files: `client/src/context/KidContext.jsx` (lines 19–36)
- Impact: Multiple pages call `refreshKids()` in `useEffect` with empty dependency arrays — they silently capture the stale reference from mount time.
- Fix approach: Use a `useRef` for `activeKid` inside the callback so it reads the latest value without being a dependency.

**`computeStars` duplicated across `MiniGame.jsx` and `progressSync.js`:**
- Issue: Star computation logic (80% threshold → 3 stars, 60% → 2 stars, else 1 star) exists independently in both the client and server. They are currently in sync but can diverge.
- Files: `client/src/pages/MiniGame.jsx` (lines 57–64), `server/src/services/progressSync.js` (lines 5–13)
- Impact: If thresholds change on the server but not the client (or vice versa), the star count shown on completion will differ from the stored value.
- Fix approach: Server is authoritative — client should display the `starsEarned` value returned from the API rather than computing it locally.

**Daily challenge slug list duplicated across client and server:**
- Issue: The ordered `DAILY_MODULE_SLUGS` array and the day-of-year formula appear identically in two places.
- Files: `client/src/data/index.js` (lines 41–50), `server/src/routes/dailyChallenge.js` (lines 5–22)
- Impact: If a new module is added or the order changes in one file, daily challenge assignments go out of sync between client display and server completion tracking.
- Fix approach: Expose a `GET /api/daily-challenge/today` public endpoint so the client fetches the slug from the server rather than computing it locally.

**`ParentDashboard` avatar map (`AVATAR_EMOJIS`) only includes 8 of 16 avatars:**
- Issue: `KidHome.jsx` defines 16 avatar entries; `ParentDashboard.jsx` defines only 8. Kids with avatars `frog`, `chick`, `hamster`, `panda`, `butterfly`, `dragon`, `dino`, or `unicorn` show a fallback `🐻` in the parent dashboard.
- Files: `client/src/pages/ParentDashboard.jsx` (lines 8–11), `client/src/pages/KidHome.jsx` (lines 26–32)
- Impact: Parents see incorrect avatar for kids who bought store avatars.
- Fix approach: Extract `AVATAR_EMOJIS` into a shared constant in `client/src/data/avatars.js` and import it everywhere.

**`useEffect` missing dependency arrays in several page components:**
- Issue: `ParentDashboard.jsx` line 20 calls `refreshKids()` in a `useEffect(() => { ... }, [])` without including `refreshKids` in the array. `ModuleComplete.jsx` has the same pattern.
- Files: `client/src/pages/ParentDashboard.jsx` (line 20), `client/src/pages/ModuleComplete.jsx` (lines 23–47)
- Impact: ESLint `react-hooks/exhaustive-deps` rule likely fires warnings in CI (though not visible because there is no test/CI pipeline).

---

## Performance Bottlenecks

**`/api/progress/:kidId/stats` runs two separate full-table scans:**
- Problem: Fetches all `LessonProgress` rows for a kid AND re-fetches all modules with all lessons and their progress — two sequential queries, each potentially large.
- Files: `server/src/routes/progress.js` (lines 88–160)
- Cause: Recommended module logic reloads the full module graph on every stats request.
- Improvement path: Cache the module list (it never changes without a server restart); compute the recommended module from the first query's data rather than re-fetching.

**`weeklyDigest.js` sends all emails sequentially in a `for...of` loop:**
- Problem: Each parent's digest email is sent one at a time. With many users, the cron job will run for a long time.
- Files: `server/src/services/weeklyDigest.js` (lines 162–183)
- Cause: Sequential loop instead of batched concurrent sends.
- Improvement path: Batch parents in groups of 10 and use `Promise.allSettled` within each batch.

**`progressSync.upsertProgress` makes 3–4 sequential DB round-trips per lesson save:**
- Problem: Each progress write does: (1) findUnique existing, (2) upsert LessonProgress, (3) update totalStars, (4) update coins, (5) findUnique for streak, (6) optionally update streak. All sequential, not batched.
- Files: `server/src/services/progressSync.js`
- Cause: Incremental growth without refactoring to use a transaction.
- Improvement path: Wrap steps 2–6 in a `prisma.$transaction([...])` to reduce round-trips; combine star and coin updates into a single `kidProfile.update`.

**`KidHome.jsx` fires 4 parallel API calls on every mount:**
- Problem: `/api/progress/:id`, `/api/achievements/:id`, `/api/kids/me/classrooms` (with a fallback to a second call), and `/api/daily-challenge/:id` all fire simultaneously.
- Files: `client/src/pages/KidHome.jsx` (lines 68–93)
- Improvement path: Add a `/api/kids/:id/home-summary` endpoint that returns all these in a single call; or implement SWR/React Query with stale-while-revalidate caching.

**Railway server cold starts on first request:**
- Problem: Railway free-tier containers sleep when idle. The app fires a `/health` ping on module load to pre-warm, but this is a race — the wake request and the real request may both arrive before the server is warm.
- Files: `client/src/lib/api.js` (line 6)
- Improvement path: Acceptable for current scale; upgrade Railway plan to eliminate cold starts if latency becomes a problem.

---

## Fragile Areas

**Streak logic runs in two places and can double-count:**
- Files: `server/src/routes/progress.js` (lines 204–214), `server/src/services/progressSync.js` (lines 68–93)
- Why fragile: Both the `POST /api/progress/:kidId/lesson/:lessonSlug` route and `upsertProgress` in `progressSync.js` independently check and update `currentStreak`. If both code paths are exercised by the same request, the streak update runs twice — but the second run is idempotent due to the `lastStr !== todayStr` guard, so it does not double-increment. However, the duplication is confusing and risky if the guard is ever relaxed.
- Safe modification: Remove the streak update block from `routes/progress.js` (lines 204–214) since `progressSync.js` already handles it.
- Test coverage: None.

**`dailyChallenge` `GET` endpoint does not verify Supabase user ownership:**
- Files: `server/src/routes/dailyChallenge.js` (lines 25–47)
- Why fragile: The GET handler only checks `req.user.type === 'kid'`; if the request comes from a Supabase (parent/teacher) token, any kidId is accepted without verifying that the parent owns the kid.
- Safe modification: Add an ownership check for Supabase callers mirroring the pattern in `resolveKidAccess` from `routes/progress.js`.

**`TracingGame` coverage algorithm uses a fixed canvas-size denominator:**
- Files: `client/src/components/games/TracingGame.jsx` (line 124)
- Why fragile: `pct = Math.min(100, Math.round((blue / (canvas.width * canvas.height * 0.08)) * 100))`. The `0.08` magic number was hand-tuned for a 320×320 canvas. If canvas size ever changes, the threshold breaks.
- Safe modification: Derive the denominator from the actual letter bounding box pixel count.

**`unlockedItems` JSON parse in `kids.js` is not guarded server-side for malformed data:**
- Files: `server/src/routes/kids.js` (line 109)
- Why fragile: `JSON.parse(kid.unlockedItems || '[]')` will throw if the stored value is malformed JSON. No try/catch exists.
- Safe modification: Wrap in try/catch and fall back to `[]` on parse failure (as the client already does).

---

## Test Coverage Gaps

**Zero test files exist in the entire codebase:**
- What's not tested: Everything — auth middleware, progress sync, streak logic, coin purchase, daily challenge, all 8 game components, offline sync.
- Files: All files under `server/src/` and `client/src/`.
- Risk: Any refactor or dependency update can silently break core game mechanics, auth, or financial logic (coins) without detection.
- Priority: High — start with `progressSync.js` (star/coin computation) and `auth.js`/`kidAuth.js` (security-critical).

**No test runner configured on either client or server:**
- What's not tested: No jest, vitest, or similar framework is installed.
- Files: `server/package.json` (no test script), `client/package.json` (no test script or vitest/jest dependency)
- Risk: Adding tests requires non-trivial setup work before any coverage can be obtained.
- Priority: High.

---

## Scaling Limits

**Classroom leaderboard loads all students and their full progress on every request:**
- Current capacity: Acceptable under 50 students per classroom.
- Limit: A classroom with hundreds of students will cause a slow response; Prisma's `include` here fetches unbounded progress rows.
- Files: `server/src/routes/classrooms.js` (lines 139–166)
- Scaling path: Add pagination; pre-compute leaderboard rankings on a schedule and cache them.

**Weekly digest iterates all parents with no cursor/pagination:**
- Current capacity: Works under a few hundred users.
- Limit: With thousands of parents the cron job will timeout or exhaust memory.
- Files: `server/src/services/weeklyDigest.js` (lines 156–183)
- Scaling path: Use `prisma.user.findMany({ cursor, take: 100 })` in a paginated loop with delays between batches.

---

## Missing Critical Features

**No toast/notification system:**
- Problem: Coin rewards, errors, and streak alerts are either silent or handled via inline state. Users get no feedback on background operations (e.g. offline sync failures).
- Blocks: Polish-tier UX; error recovery guidance for users.

**No Error Boundary:**
- Problem: A React render error anywhere in the component tree crashes the entire app with a blank white screen.
- Blocks: Production resilience — a single bad lesson data entry can make the whole app unplayable.

**No input sanitization on `name` fields stored in DB:**
- Problem: Kid names and classroom names accept any string and are stored/rendered without sanitization.
- Files: `server/src/routes/kids.js` (line 41), `server/src/routes/classrooms.js` (line 50)
- Risk: Stored XSS in email digests (HTML template in `weeklyDigest.js` interpolates `kid.name` directly) or in future admin views.
- Fix: Escape HTML entities in `buildEmailHtml`; consider a max-length and character whitelist for display names.

---

*Concerns audit: 2026-03-18*
