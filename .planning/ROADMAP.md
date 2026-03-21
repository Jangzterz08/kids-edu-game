# Roadmap: KidsLearn

## Overview

KidsLearn is a deployed educational game for kids aged 3–8. The product works and is live. This roadmap covers the path from a deployed MVP to a sustainable business: first locking down security before touching payments, then polishing the UX, optimizing performance, adding freemium parent subscriptions, adding school licensing, wiring up the already-migrated adaptive learning schema, and finally instrumenting the app for observability. Phases execute in strict dependency order — monetization cannot ship until security is solid.

## Phases

- [x] **Phase 1: Security Hardening** - Fix auth and data vulnerabilities before any payment flows ship (completed 2026-03-19)
- [x] **Phase 2: Polish & UX** - Complete the pending production finish work for a professional feel (completed 2026-03-20)
- [ ] **Phase 3: Performance** - Reduce API round-trips and eliminate serial bottlenecks before monetization scale
- [x] **Phase 4: Parent Subscriptions** - Freemium gate + Stripe Checkout for individual family revenue (completed 2026-03-21)
- [ ] **Phase 5: School Licensing** - B2B Stripe seat licensing and school admin tooling
- [ ] **Phase 6: Adaptive Learning** - Wire existing DB tables into live difficulty tracking and recommendations
- [ ] **Phase 7: Analytics & Observability** - Sentry error tracking and enriched parent/teacher dashboards

## Phase Details

### Phase 1: Security Hardening
**Goal**: The app is safe to charge money — no exploitable auth gaps, no client-trusted prices, no XSS vectors
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. A kid cannot buy a CoinStore item for fewer coins than its canonical server-side price, even by crafting a custom POST body
  2. The kid-login endpoint rejects more than 10 requests per minute from the same IP
  3. A kid or classroom name containing HTML tags is stored and rendered escaped — no raw HTML appears in email digests
  4. Starting the server in production without Supabase env vars throws a startup error and refuses to serve traffic
  5. Two simultaneous coin-purchase requests from the same kid cannot both succeed for the same item
**Plans:** 2/2 plans complete
Plans:
- [ ] 01-01-PLAN.md — Test infrastructure + server-side price validation (SEC-01) + rate limiting (SEC-02)
- [ ] 01-02-PLAN.md — HTML sanitization (SEC-03) + startup guard (SEC-04) + Prisma transaction (SEC-05) + body destructuring (SEC-06)

### Phase 2: Polish & UX
**Goal**: Every user-facing rough edge from the pending TODO list is resolved — the app looks and behaves like a finished product
**Depends on**: Phase 1
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-07, POL-08, POL-09
**Success Criteria** (what must be TRUE):
  1. Earning coins, hitting a streak, or losing connectivity shows a visible toast notification — no silent background operation
  2. A React render crash shows a friendly recovery screen rather than a blank white page
  3. A parent visiting the app on the second visit on mobile sees a prompt to add it to their home screen
  4. A parent whose kid purchased a store avatar sees the correct avatar emoji in ParentDashboard (no fallback bear)
  5. Sharing a KidsLearn link on iMessage or Slack shows the correct preview image and title
**Plans:** 3/3 plans complete
Plans:
- [ ] 02-01-PLAN.md — Toast notifications (POL-01) + Error Boundary (POL-02)
- [ ] 02-02-PLAN.md — PWA install prompt (POL-03) + Offline banner (POL-04) + Security headers (POL-05) + OG meta (POL-06)
- [ ] 02-03-PLAN.md — Avatar unification (POL-07) + Server-side stars (POL-08) + Daily challenge endpoint (POL-09)

### Phase 3: Performance
**Goal**: The app loads fast enough that no user experiences a noticeable wait on any main screen
**Depends on**: Phase 2
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. KidHome loads its full data (progress, achievements, classrooms, daily challenge) in a single network request rather than four
  2. Saving a lesson result triggers one DB transaction rather than 3–4 sequential round-trips
  3. The weekly digest cron completes without sequentially blocking on each parent — sends are batched
**Plans:** 1/2 plans executed
Plans:
- [ ] 03-01-PLAN.md — Home-summary aggregated endpoint (PERF-01) + KidHome client update
- [ ] 03-02-PLAN.md — Transaction-wrapped progress save (PERF-02) + parallel stats queries (PERF-03) + batched digest sends (PERF-04)

### Phase 4: Parent Subscriptions
**Goal**: Parents can subscribe, be billed automatically, and manage their subscription — the app earns recurring revenue
**Depends on**: Phase 3
**Requirements**: MON-01, MON-02, MON-03, MON-04, MON-05, MON-06
**Success Criteria** (what must be TRUE):
  1. A new parent gets 7 days of full access automatically on signup with no payment required
  2. After the trial, modules 4–13 are locked and a kid who taps a locked module sees a paywall screen
  3. A parent can complete Stripe Checkout and immediately unlock all modules for their kids
  4. When a subscription is cancelled or payment fails, modules re-lock on the next session without manual intervention
  5. A parent can view their plan status and reach the Stripe billing portal to cancel or change plan from within the app
**Plans:** 3/3 plans complete
Plans:
- [ ] 04-01-PLAN.md — Prisma migration + subscription utils + trial init + home-summary subscription data (MON-01, MON-06)
- [ ] 04-02-PLAN.md — Stripe billing routes (checkout, webhook, portal) + module gate in progress route (MON-02, MON-03, MON-04)
- [ ] 04-03-PLAN.md — ParentDashboard subscription UI + KidHome locked ModuleCards (MON-05)

### Phase 5: School Licensing
**Goal**: Schools can purchase a seat license, provision teachers and classrooms, and have all content unlocked for enrolled kids
**Depends on**: Phase 4
**Requirements**: SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06
**Success Criteria** (what must be TRUE):
  1. A school admin can purchase a seat license via Stripe Checkout and receive a licensed school account
  2. Teachers provisioned under a licensed school can create classrooms that count against the school's seat allocation
  3. Kids enrolled in a licensed school's classroom have all 13 modules unlocked regardless of their parent's subscription status
  4. A school admin can see seats used, renewal date, and download invoice history from their dashboard
  5. License expiry or non-renewal automatically revokes content access for the school's kids
**Plans**: TBD

### Phase 6: Adaptive Learning
**Goal**: KidHome surfaces personalized module recommendations and a review queue based on each kid's actual score history
**Depends on**: Phase 5
**Requirements**: ADL-01, ADL-02, ADL-03
**Success Criteria** (what must be TRUE):
  1. Completing a lesson writes a difficulty record — the ModuleDifficulty and ReviewSchedule tables are no longer empty for active kids
  2. A kid's KidHome shows a "Recommended" section surfacing modules where they scored 60–80% (not mastered, not too hard)
  3. A kid who scored below 60% on a lesson sees that lesson appear in a "Review Today" section on KidHome
**Plans**: TBD

### Phase 7: Analytics & Observability
**Goal**: Errors are captured automatically and dashboards give parents and teachers actionable insight into learning progress
**Depends on**: Phase 6
**Requirements**: OBS-01, OBS-02, OBS-03
**Success Criteria** (what must be TRUE):
  1. An unhandled exception on client or server is captured in Sentry with full stack trace — no silent failure
  2. A parent can see how many minutes their kid spent in the app this week and a per-module star trend chart
  3. A teacher can identify which kids in their classroom are struggling with which modules from the teacher dashboard
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security Hardening | 2/2 | Complete   | 2026-03-19 |
| 2. Polish & UX | 3/3 | Complete   | 2026-03-20 |
| 3. Performance | 1/2 | In Progress|  |
| 4. Parent Subscriptions | 3/3 | Complete   | 2026-03-21 |
| 5. School Licensing | 0/TBD | Not started | - |
| 6. Adaptive Learning | 0/TBD | Not started | - |
| 7. Analytics & Observability | 0/TBD | Not started | - |
