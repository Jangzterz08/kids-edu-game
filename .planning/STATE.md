---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 05-school-licensing plan 04
last_updated: "2026-03-21T07:14:11.696Z"
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 15
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.
**Current focus:** Phase 05 — school-licensing

## Current Position

Phase: 05 (school-licensing) — EXECUTING
Plan: 1 of 4

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: none yet
- Trend: -

*Updated after each plan completion*
| Phase 01-security-hardening P01 | 12 | 2 tasks | 9 files |
| Phase 01-security-hardening P02 | 7 | 2 tasks | 9 files |
| Phase 02-polish-ux P01 | 3 | 2 tasks | 5 files |
| Phase 02-polish-ux P02 | 3 | 2 tasks | 6 files |
| Phase 02-polish-ux P03 | 4 | 2 tasks | 11 files |
| Phase 03-performance P01 | 165 | 2 tasks | 5 files |
| Phase 03-performance P02 | 4 | 2 tasks | 7 files |
| Phase 04-parent-subscriptions P01 | 7 | 2 tasks | 9 files |
| Phase 04-parent-subscriptions P02 | 9 | 2 tasks | 7 files |
| Phase 04-parent-subscriptions P03 | 45 | 3 tasks | 3 files |
| Phase 04-parent-subscriptions P04 | 3 | 2 tasks | 5 files |
| Phase 05-school-licensing P01 | 5 | 2 tasks | 6 files |
| Phase 05-school-licensing P02 | 366 | 2 tasks | 9 files |
| Phase 05-school-licensing P03 | 4 | 2 tasks | 4 files |
| Phase 05-school-licensing P04 | 15 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

From PROJECT.md Key Decisions table:

- Security before monetization: Can't charge money with a broken auth model
- Freemium: first 3 modules free — low barrier, parents see value before paying
- School license unlocks all content: Schools won't adopt per-kid billing complexity
- 7-day free trial: Reduce friction for first conversion
- Stripe for both B2C and B2B: Single provider simplifies reconciliation
- [Phase 01-security-hardening]: Use vi.spyOn(global.prisma) not vi.mock() for CJS server tests: Vitest mocks ESM imports but cannot intercept CJS require() at runtime
- [Phase 01-security-hardening]: STORE_ITEMS canonical price map in kids.js (not DB table): static config, no migration needed
- [Phase 01-security-hardening]: express-rate-limit 8.3.1 with trust proxy:1 on kid auth endpoints (10 req/min) for Railway reverse proxy compatibility
- [Phase 01-security-hardening P02]: he.escape() via esc() helper in weeklyDigest.js for HTML entity encoding of all user-supplied strings
- [Phase 01-security-hardening P02]: Startup guard throws at module load time (not runtime) when SUPABASE_URL or SUPABASE_SERVICE_KEY missing in production
- [Phase 01-security-hardening P02]: Prisma interactive transaction ($transaction async callback) wraps coin purchase for race-safe read-modify-write
- [Phase 01-security-hardening P02]: req.body allowlist destructuring in progress route instead of ...req.body spread
- [Phase 02-polish-ux]: sonner@2.0.7 + react-error-boundary@6.1.1 installed; toast calls in useProgress.js hook (not MiniGame.jsx); streakCount added to POST /lesson response
- [Phase 02-polish-ux]: Duplicate streak update in progress route removed — upsertProgress in progressSync.js is single owner of streak logic
- [Phase 02-polish-ux]: OfflineBanner and InstallPrompt mounted in App.jsx using React Fragment — avoids Router/Provider dependency while keeping always-rendered, conditionally-visible pattern
- [Phase 02-polish-ux]: CSP connect-src in vercel.json scoped to Supabase wildcard + Railway URL — must update when new third-party APIs are added
- [Phase 02-polish-ux]: Single AVATAR_EMOJIS constant in lib/avatars.js (16 entries, dino: 🦖) — all 7 consumers import from it
- [Phase 02-polish-ux]: computeStars removed from MiniGame.jsx — server progressSync.js is sole authority on starsEarned
- [Phase 02-polish-ux]: /today endpoint added before /:kidId in dailyChallenge.js to avoid Express route shadowing; ModuleComplete.jsx fetches slug from API
- [Phase 03-performance]: Shared dailyChallengeUtils.js CJS module avoids duplicating DAILY_SLUGS array and pure functions across route files
- [Phase 03-performance]: home-summary endpoint uses Promise.all for parallel DB queries; refreshKids removed from KidHome — kid stats served directly by aggregated endpoint
- [Phase 03-performance]: Streak update remains outside prisma.$transaction as non-critical best-effort — streak failure must not roll back the lesson save
- [Phase 03-performance]: Two kidProfile.update calls (stars + coins) merged into one conditional update inside transaction using dataUpdate object
- [Phase 03-performance]: Promise.allSettled for digest batch: individual send failures logged but do not abort the batch (BATCH_SIZE=10)
- [Phase 03-performance]: sec06 test updated to spy on prisma.$transaction (not lessonProgress.upsert) since upsertProgress now wraps all DB writes in a transaction
- [Phase 04-parent-subscriptions]: Use prisma migrate deploy (not migrate dev) for non-interactive CI/test environments — migrate dev requires a TTY
- [Phase 04-parent-subscriptions]: In tests, set SUPABASE_URL='' before app import to force null supabase client and mock user path in auth middleware
- [Phase 04-parent-subscriptions P02]: Expose module.exports.stripe from billing.js; use createRequire(import.meta.url) in tests — ESM dynamic import of CJS creates separate instance, spy on it never intercepts route calls
- [Phase 04-parent-subscriptions P02]: Stripe fallback key 'sk_test_placeholder' prevents startup failure when non-billing test files load index.js without STRIPE_SECRET_KEY set
- [Phase 04-parent-subscriptions P02]: Webhook mounted before express.json() using express.raw({ type: 'application/json' }) — required for Stripe signature verification on raw body
- [Phase 04-parent-subscriptions]: Billing checkout accepts plan name (monthly/annual) not raw Stripe price ID; server maps to env vars internally
- [Phase 04-parent-subscriptions]: isPremium defaults to true in KidHome to prevent flash of locked modules during initial API load
- [Phase 04-parent-subscriptions]: Outcome-based testing for CJS/ESM mock boundary: verify prisma.user.update instead of Resend constructor mock when vi.mock cannot intercept require()
- [Phase 05-school-licensing]: vi.spyOn in beforeEach (not module top-level) for Prisma spies in school tests — vi.restoreAllMocks() in afterEach destroys top-level spy references
- [Phase 05-school-licensing]: getKidSchoolLicense uses single prisma.classroomStudent.findFirst with deep nested include to avoid N+1 queries on the kid->classroom->teacher->school chain
- [Phase 05-school-licensing]: schoolBilling.js exports module.exports.stripe for CJS spy access in tests (mirrors billing.js pattern)
- [Phase 05-school-licensing]: Seat cap check and schoolTeacher.create wrapped in prisma.$transaction to prevent race conditions under concurrent requests
- [Phase 05-school-licensing]: Webhook routes school events by checking schoolId metadata first (checkout) or findFirst by subscriptionId/customerId (deletion/payment_failed) before falling through to parent handler
- [Phase 05-school-licensing]: School license check placed inside !isParentPremium branch — premium parents never incur the extra DB query
- [Phase 05-school-licensing]: sendUpgradeNudge fires only when BOTH parent non-premium AND no school license — avoids spamming school-enrolled parents
- [Phase 05-school-licensing]: mon01 tests needed classroomStudent.findFirst mock (null) in both beforeEach blocks — getKidSchoolLicense uses findFirst not findMany
- [Phase 05-school-licensing]: SchoolDashboard placed inside teacher ProtectedRoute — non-admin teachers hit 403 from API and see error message rather than a separate route guard

### Pending Todos

None yet.

### Blockers/Concerns

- Zero test coverage exists — any refactor in security phase carries regression risk with no safety net
- `unlockedItems` stored as TEXT/JSON (not a join table) — SEC-05 transaction fix is a workaround; full migration to join table is v2 tech debt
- Railway cold starts on free tier — acceptable now, monitor after monetization traffic increases

## Session Continuity

Last session: 2026-03-21T07:14:11.693Z
Stopped at: Completed 05-school-licensing plan 04
Resume file: None
