# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-21
**Phases:** 7 | **Plans:** 22 | **Commits:** 184 | **Timeline:** 13 days (Mar 8–21, 2026)

### What Was Built
- **Security baseline** — server-side price enforcement, JWT hardening, rate limiting, XSS sanitization, startup guards, Prisma transaction wrapping (6 test suites)
- **UX polish** — sonner toast system, React Error Boundary, PWA install prompt, offline banner, security headers, OG meta tags, unified avatar map
- **Performance** — `/home-summary` aggregation endpoint (4 API calls → 1), transactional progress save, parallelized queries, batched digest sends
- **Parent subscriptions** — full Stripe freemium flow: 7-day trial, monthly/annual Checkout, webhook handler, subscription management UI, paywall for locked modules
- **School licensing** — B2B seat licensing via Stripe, school admin dashboard, teacher provisioning, classroom seat counting, license-gated content unlock
- **Adaptive learning** — SM-2 difficulty tracking on every lesson save, personalized module recommendations + review queue surfaced on KidHome
- **Analytics & observability** — Sentry on client + server, session heartbeat tracking, parent analytics dashboard (recharts charts), teacher classroom performance matrix

### What Worked
- **Wave-based parallel execution** — plans within a wave ran concurrently (e.g., 07-01 + 07-02 in parallel), cutting wall-clock time significantly
- **CJS mocking pattern** — `vi.spyOn(global.prisma.model, 'method')` established early in Phase 1 and reused across all 36 tests without friction
- **Checkpoint plans** — `autonomous: false` plans cleanly paused for human verification (viewport fix in Phase 7), then resumed with a fresh continuation agent
- **Deviations auto-corrected** — executors caught plan issues (missing `requireAuth`, doubled route paths) and fixed them without blocking, reducing rework
- **`home-summary` endpoint** — aggregating 4 API calls into 1 paid dividends in every subsequent phase (adaptive learning, subscriptions, analytics all extended it)

### What Was Inefficient
- **obs01-sentry test** — set `NODE_ENV=production` to enable Sentry but missed stubbing `SUPABASE_URL`/`SUPABASE_SERVICE_KEY`, causing a regression that needed a hotfix commit
- **Phase 3 ROADMAP stale** — ROADMAP.md showed Phase 3 as `1/2 plans` incomplete even after completion; `roadmap_complete: false` lingered throughout subsequent phases
- **Summary one-liner extraction** — gsd-tools `summary-extract --fields one_liner` returned null for all Phase 7 summaries (field not in frontmatter); relied on inline reading instead

### Patterns Established
- **CJS test mocking:** `vi.spyOn(global.prisma.model, 'method')` — vi.mock() cannot intercept CJS require() at runtime
- **Production env stubs in tests:** Always set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `DATABASE_URL` before importing app in any test setting `NODE_ENV=production`
- **Route ordering:** Mount specific routes (`/today`, `/heartbeat`, `/home-summary`) before param routes (`/:kidId`) to avoid Express shadowing
- **home-summary extension pattern:** New data requirements from later phases are added to the `/home-summary` aggregation rather than creating new endpoints
- **Sentry integration:** Use `onError` callback in existing ErrorBoundary rather than wrapping with `<Sentry.ErrorBoundary>` to avoid double boundary nesting

### Key Lessons
1. **Security before monetization pays off** — Phase 1 caught 6 real vulnerabilities (price manipulation, race conditions, XSS) that would have been exploitable in production payments
2. **Aggregation endpoints earn compound returns** — `/home-summary` built in Phase 3 was extended in Phases 4, 5, 6, and 7; the upfront investment saved 4+ separate endpoints
3. **Test env vars need complete production stubs** — any test using `NODE_ENV=production` must stub ALL production guards, not just the one being tested
4. **SM-2 for adaptive learning is a solid default** — simple to implement, well-understood, and produces sensible recommendations without ML complexity

### Cost Observations
- Model mix: ~100% sonnet (executor + verifier), planner used opus for research phases
- Sessions: ~10 across 13 days
- Notable: Wave-based parallelism in Phase 7 (3 waves × parallel agents) completed in one session; checkpoint handling for human-verify added minimal overhead

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Improvement |
|-----------|--------|-------|-----------------|
| v1.0 MVP | 7 | 22 | Established CJS mocking pattern, wave-based execution, home-summary aggregation |

### Recurring Issues

| Issue | Milestones Affected | Status |
|-------|---------------------|--------|
| Test env stubs incomplete in production-mode tests | v1.0 | Fixed (hotfix commit) |
| ROADMAP plan checkboxes not updated by executor | v1.0 | Known — verify manually |

### What to Carry Forward to v1.1

- Always include all production env stubs in test setup files
- Add `one_liner` field to SUMMARY.md frontmatter template for better progress tooling
- Consider surfacing `roadmap_complete: false` phases in `/gsd:progress` for earlier detection
