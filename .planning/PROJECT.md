# KidsLearn

## What This Is

KidsLearn is a deployed educational game for young children (ages 3–8) covering alphabet, numbers, shapes, emotions, and more through 8 interactive game types. Parents manage their child's profile; teachers run classrooms with leaderboards. The next milestone is turning it into a sustainable business through freemium parent subscriptions and school licensing.

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

### Active

#### Security & Stability
- [x] **SEC-01**: Server validates item prices server-side, never trusting client-supplied price — Validated in Phase 1: Security Hardening
- [x] **SEC-02**: Rate limiting on kid-login (10 req/min per IP) and kid-lookup endpoints — Validated in Phase 1: Security Hardening
- [x] **SEC-03**: Input sanitization on name fields to prevent stored XSS in email digests — Validated in Phase 1: Security Hardening
- [x] **SEC-04**: Supabase env var absence throws startup error in production (no silent mock-user fallback) — Validated in Phase 1: Security Hardening
- [x] **SEC-05**: `unlockedItems` write wrapped in Prisma transaction to prevent race conditions — Validated in Phase 1: Security Hardening
- [x] **SEC-06**: `req.body` destructured to known fields before DB upsert — Validated in Phase 1: Security Hardening

#### Polish
- [x] **POL-01**: Toast notification system for coin rewards, streak alerts, and errors — Validated in Phase 2: Polish & UX
- [x] **POL-02**: React Error Boundary catches render crashes gracefully — Validated in Phase 2: Polish & UX
- [x] **POL-03**: PWA install prompt nudges users to add to home screen — Validated in Phase 2: Polish & UX
- [x] **POL-04**: Offline indicator banner when connectivity is lost — Validated in Phase 2: Polish & UX
- [x] **POL-05**: Security headers in vercel.json (CSP, X-Frame-Options, etc.) — Validated in Phase 2: Polish & UX
- [x] **POL-06**: OG meta tags + social preview image for link sharing — Validated in Phase 2: Polish & UX
- [x] **POL-07**: Avatar map unified across all components (ParentDashboard shows wrong emoji for 8 avatars) — Validated in Phase 2: Polish & UX
- [x] **POL-08**: `computeStars` logic consolidated to server-authoritative (client displays server value) — Validated in Phase 2: Polish & UX
- [x] **POL-09**: Daily challenge slug sourced from server API (eliminate client/server duplication) — Validated in Phase 2: Polish & UX

#### Performance
- [x] **PERF-01**: `/api/kids/:id/home-summary` endpoint aggregates KidHome's 4 API calls into 1 — Validated in Phase 3: Performance
- [x] **PERF-02**: `progressSync.upsertProgress` wrapped in single Prisma transaction (reduce 3–4 round-trips) — Validated in Phase 3: Performance
- [x] **PERF-03**: Stats endpoint parallelized via Promise.all (2 queries run concurrently) — Validated in Phase 3: Performance
- [x] **PERF-04**: Weekly digest batched with `Promise.allSettled` in groups of 10 — Validated in Phase 3: Performance

#### Monetization — Parent Subscriptions
- [ ] **MON-01**: Freemium tier: first 3 modules free, remaining 10 require premium subscription
- [ ] **MON-02**: Stripe Checkout integration for parent monthly/annual subscription
- [ ] **MON-03**: Webhook handler for Stripe events (payment success, cancellation, renewal)
- [ ] **MON-04**: Parent subscription management page (status, cancel, billing portal)
- [ ] **MON-05**: Paywall UI shown to kids when attempting locked module (parent notified)
- [ ] **MON-06**: Free trial period (7 days) for new parent signups

#### Monetization — School Licensing
- [ ] **SCH-01**: School entity in DB with seat count and license expiry
- [ ] **SCH-02**: School admin role can purchase and manage seat licenses
- [ ] **SCH-03**: Teachers provisioned under a school; classrooms count against school seats
- [ ] **SCH-04**: School license unlocks all content for all kids in enrolled classrooms
- [ ] **SCH-05**: Stripe Checkout for school license purchase (one-time or annual)
- [ ] **SCH-06**: School admin dashboard: seats used, renewal date, invoice history

#### Adaptive Learning
- [ ] **ADL-01**: Difficulty level tracked per kid per module based on score history
- [ ] **ADL-02**: Smart module recommendations shown on KidHome based on difficulty data
- [ ] **ADL-03**: Review scheduling surfaces lessons where kid scored below 60%

#### Analytics & Observability
- [ ] **OBS-01**: Sentry error tracking on client and server
- [ ] **OBS-02**: Parent dashboard shows time-on-app, lessons completed per day, star trends
- [ ] **OBS-03**: Teacher dashboard shows class-level performance metrics per module

### Out of Scope

- Real-time multiplayer — high complexity, no demand signal yet
- Video content — storage/bandwidth costs prohibitive at current scale
- Mobile native app (iOS/Android) — PWA covers this use case for now
- AI-generated lesson content — out of scope until content library is saturated
- In-app chat/messaging — safety/moderation overhead not worth it

## Context

- Client: React + Vite, deployed on Vercel (`kids-edu-game.vercel.app`)
- Server: Express + Prisma 7 + Supabase PostgreSQL, deployed on Railway (`kids-edu-game-production.up.railway.app`)
- Auth: Dual JWT — Supabase for adults, custom kid JWT for children
- Content is static JS modules on client mirroring DB seed (13 modules, 117 lessons)
- Adaptive learning schema already exists in DB (ModuleDifficulty, ReviewSchedule tables) but has zero application code — ready to be wired up
- 27 tests across 10 files (security + performance) — Phase 1–3 coverage

## Constraints

- **Tech stack**: Express + React + Prisma — no framework changes
- **Database**: Supabase PostgreSQL with `kids_edu_game` schema — no migrations to a different provider
- **Payments**: Stripe — industry standard, required for both B2C and B2B flows
- **Deploy**: Vercel (client) + Railway (server) — maintain current deploy targets
- **Safety**: Children's app — no social features, no user-generated content exposed to kids

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Freemium: first 3 modules free | Low barrier to entry; parents see value before paying | — Pending |
| School license unlocks all content for enrolled kids | Schools won't adopt per-kid billing complexity | — Pending |
| 7-day free trial | Reduce friction for first conversion | — Pending |
| Stripe for both B2C and B2B | Single payment provider simplifies reconciliation | — Pending |
| Security fixes before monetization | Can't charge money with a broken auth model | — Pending |

---
*Last updated: 2026-03-20 after Phase 3: Performance completion*
