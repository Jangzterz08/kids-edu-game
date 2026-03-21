---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 04-parent-subscriptions plan 01
last_updated: "2026-03-21T00:29:11.662Z"
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 10
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.
**Current focus:** Phase 04 — parent-subscriptions

## Current Position

Phase: 04 (parent-subscriptions) — EXECUTING
Plan: 1 of 3

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

### Pending Todos

None yet.

### Blockers/Concerns

- Zero test coverage exists — any refactor in security phase carries regression risk with no safety net
- `unlockedItems` stored as TEXT/JSON (not a join table) — SEC-05 transaction fix is a workaround; full migration to join table is v2 tech debt
- Railway cold starts on free tier — acceptable now, monitor after monetization traffic increases

## Session Continuity

Last session: 2026-03-21T00:29:11.660Z
Stopped at: Completed 04-parent-subscriptions plan 01
Resume file: None
