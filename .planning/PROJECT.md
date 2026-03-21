# KidsLearn

## What This Is

KidsLearn is a deployed educational game for young children (ages 3–8) covering alphabet, numbers, shapes, emotions, and more through 8 interactive game types. Parents subscribe to unlock the full content library; schools purchase seat licenses to provision teachers and classrooms. The app includes adaptive learning recommendations, parent and teacher analytics dashboards, and full error observability via Sentry.

## Core Value

Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.

## Requirements

### Validated

- ✓ Kid authentication via PIN + custom JWT — existing
- ✓ Parent/teacher authentication via Supabase email/password — existing
- ✓ 13 learning modules with 117 lessons across alphabet, numbers, shapes, colors, animals, emotions, etc. — existing
- ✓ 8 game types: matching, tracing, quiz, spelling, phonics, pattern, oddOneOut, scramble — existing
- ✓ Coins economy: earned per lesson, spent in CoinStore for avatars — existing
- ✓ Streak tracking + achievements — existing
- ✓ Classroom system: teacher creates → join code → parent enrolls kid → leaderboard — existing
- ✓ Daily Challenge: rotates through 13 modules, +20 bonus coins — existing
- ✓ Weekly parent email digest via Resend — existing
- ✓ Offline-first progress sync via localStorage — existing
- ✓ PWA manifest + icons — existing
- ✓ Deployed: client on Vercel, server on Railway, DB on Supabase — existing
- ✓ **SEC-01**: Server validates item prices server-side, never trusting client-supplied price — v1.0
- ✓ **SEC-02**: Rate limiting on kid-login (10 req/min per IP) and kid-lookup endpoints — v1.0
- ✓ **SEC-03**: Input sanitization on name fields to prevent stored XSS in email digests — v1.0
- ✓ **SEC-04**: Supabase env var absence throws startup error in production — v1.0
- ✓ **SEC-05**: `unlockedItems` write wrapped in Prisma transaction — v1.0
- ✓ **SEC-06**: `req.body` destructured to known fields before DB upsert — v1.0
- ✓ **POL-01**: Toast notification system (sonner) for coin rewards, streak alerts, errors — v1.0
- ✓ **POL-02**: React Error Boundary catches render crashes gracefully — v1.0
- ✓ **POL-03**: PWA install prompt nudges users to add to home screen — v1.0
- ✓ **POL-04**: Offline indicator banner when connectivity is lost — v1.0
- ✓ **POL-05**: Security headers in vercel.json (CSP, X-Frame-Options, etc.) — v1.0
- ✓ **POL-06**: OG meta tags + social preview image for link sharing — v1.0
- ✓ **POL-07**: Avatar map unified across all components — v1.0
- ✓ **POL-08**: `computeStars` consolidated to server-authoritative — v1.0
- ✓ **POL-09**: Daily challenge slug sourced from server API — v1.0
- ✓ **PERF-01**: `/api/kids/:id/home-summary` aggregates KidHome's 4 API calls into 1 — v1.0
- ✓ **PERF-02**: `progressSync.upsertProgress` wrapped in single Prisma transaction — v1.0
- ✓ **PERF-03**: Stats endpoint parallelized via Promise.all — v1.0
- ✓ **PERF-04**: Weekly digest batched with `Promise.allSettled` in groups of 10 — v1.0
- ✓ **MON-01**: Freemium tier: first 3 modules free, remaining 10 require premium subscription — v1.0
- ✓ **MON-02**: Stripe Checkout integration for parent monthly/annual subscription — v1.0
- ✓ **MON-03**: Webhook handler for Stripe events (payment success, cancellation, renewal) — v1.0
- ✓ **MON-04**: Parent subscription management page (status, cancel, billing portal) — v1.0
- ✓ **MON-05**: Paywall UI shown to kids when attempting locked module — v1.0
- ✓ **MON-06**: Free trial period (7 days) for new parent signups — v1.0
- ✓ **SCH-01**: School entity in DB with seat count and license expiry — v1.0
- ✓ **SCH-02**: School admin role can purchase and manage seat licenses — v1.0
- ✓ **SCH-03**: Teachers provisioned under a school; classrooms count against school seats — v1.0
- ✓ **SCH-04**: School license unlocks all content for all kids in enrolled classrooms — v1.0
- ✓ **SCH-05**: Stripe Checkout for school license purchase (one-time or annual) — v1.0
- ✓ **SCH-06**: School admin dashboard: seats used, renewal date, invoice history — v1.0
- ✓ **ADL-01**: Difficulty level tracked per kid per module based on score history — v1.0
- ✓ **ADL-02**: Smart module recommendations shown on KidHome based on difficulty data — v1.0
- ✓ **ADL-03**: Review scheduling surfaces lessons where kid scored below 60% — v1.0
- ✓ **OBS-01**: Sentry error tracking on client and server — v1.0
- ✓ **OBS-02**: Parent dashboard shows time-on-app, lessons completed per day, star trends — v1.0
- ✓ **OBS-03**: Teacher dashboard shows class-level performance metrics per module — v1.0

### Active

*(Next milestone requirements defined via `/gsd:new-milestone`)*

### Out of Scope

- Real-time multiplayer — high complexity, no demand signal yet
- Video content — storage/bandwidth costs prohibitive at current scale
- Mobile native app (iOS/Android) — PWA covers this use case for now; v2 consideration
- AI-generated lesson content — out of scope until content library is saturated
- In-app chat/messaging — child safety/moderation overhead not justified
- Per-lesson microtransactions — too granular; subscription model is simpler

## Context

- **Shipped:** v1.0 MVP — 2026-03-21
- **Client:** React + Vite, deployed on Vercel (`kids-edu-game.vercel.app`)
- **Server:** Express + Prisma 7 + Supabase PostgreSQL, deployed on Railway
- **Auth:** Dual JWT — Supabase for adults, custom kid JWT for children
- **Payments:** Stripe (parent subscriptions + school seat licenses)
- **Test suite:** 36 tests across 10 files (security, performance, monetization, school, adaptive, observability)
- **Source:** ~12,400 LOC (JS/JSX across client + server)
- **Content:** 13 modules, 117 lessons, 8 game types — all static JS modules on client
- **Observability:** Sentry on client + server; session tracking in DB; parent + teacher analytics dashboards

## Constraints

- **Tech stack**: Express + React + Prisma — no framework changes
- **Database**: Supabase PostgreSQL with `kids_edu_game` schema — no migrations to a different provider
- **Payments**: Stripe — industry standard, required for both B2C and B2B flows
- **Deploy**: Vercel (client) + Railway (server) — maintain current deploy targets
- **Safety**: Children's app — no social features, no user-generated content exposed to kids

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Security fixes before monetization | Can't charge money with a broken auth model | ✓ Good — prevented shipping broken payment flows |
| Freemium: first 3 modules free | Low barrier to entry; parents see value before paying | ✓ Good |
| School license unlocks all content for enrolled kids | Schools won't adopt per-kid billing complexity | ✓ Good |
| 7-day free trial | Reduce friction for first conversion | ✓ Good |
| Stripe for both B2C and B2B | Single payment provider simplifies reconciliation | ✓ Good |
| CJS mocking via vi.spyOn(global.prisma) | vi.mock() cannot intercept CJS require() at runtime | ✓ Good — established reusable test pattern |
| home-summary aggregation endpoint | Eliminate 4 sequential API calls on KidHome load | ✓ Good — significant perceived perf improvement |
| SM-2 algorithm for adaptive learning | Battle-tested spaced repetition; simple to implement | ✓ Good |
| Sentry onError callback vs ErrorBoundary wrapper | Avoids double boundary nesting; simpler integration | ✓ Good |
| useSessionHeartbeat with sendBeacon on unload | Reliable session end even on tab close | ✓ Good |

---
*Last updated: 2026-03-21 after v1.0 milestone*
