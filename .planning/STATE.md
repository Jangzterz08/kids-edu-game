---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
stopped_at: Completed 02-polish-ux 02-03-PLAN.md
last_updated: "2026-03-20T19:05:23.027Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 5
  completed_plans: 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.
**Current focus:** Phase 02 — polish-ux

## Current Position

Phase: 02 (polish-ux) — EXECUTING
Plan: 2 of 3

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

### Pending Todos

None yet.

### Blockers/Concerns

- Zero test coverage exists — any refactor in security phase carries regression risk with no safety net
- `unlockedItems` stored as TEXT/JSON (not a join table) — SEC-05 transaction fix is a workaround; full migration to join table is v2 tech debt
- Railway cold starts on free tier — acceptable now, monitor after monetization traffic increases

## Session Continuity

Last session: 2026-03-20T18:55:46.028Z
Stopped at: Completed 02-polish-ux 02-03-PLAN.md
Resume file: None
