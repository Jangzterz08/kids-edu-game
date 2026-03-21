# Requirements: KidsLearn

**Defined:** 2026-03-18
**Core Value:** Kids learn and parents pay — every decision should make the learning loop more engaging and the payment friction lower.

## v1 Requirements

### Security

- [x] **SEC-01**: Server validates item prices server-side (canonical price map keyed by itemId), never trusting client-supplied price
- [x] **SEC-02**: Rate limiting on kid-login (10 req/min per IP) and kid-lookup endpoints via express-rate-limit
- [x] **SEC-03**: Kid and classroom names sanitized (HTML entity escape) before storage and rendering in email digests
- [x] **SEC-04**: Server throws startup error in production if Supabase env vars are absent (no silent mock-user fallback)
- [x] **SEC-05**: `unlockedItems` coin purchase wrapped in Prisma transaction to prevent lost-update race condition
- [x] **SEC-06**: `req.body` destructured to known fields before DB upsert in progress route

### Polish

- [x] **POL-01**: Toast notification system provides feedback for coin rewards, streak alerts, errors, and offline sync failures
- [x] **POL-02**: React Error Boundary catches render crashes and displays a friendly recovery screen instead of blank white page
- [x] **POL-03**: PWA install prompt nudges users to add KidsLearn to home screen (shown after 2nd visit)
- [x] **POL-04**: Offline indicator banner appears when connectivity is lost; dismisses on reconnect
- [x] **POL-05**: Security headers configured in vercel.json (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [x] **POL-06**: OG meta tags and social preview image (1200×630) configured for link sharing
- [x] **POL-07**: Avatar emoji map unified into shared constant used by KidHome, ParentDashboard, and all other consumers
- [x] **POL-08**: `computeStars` removed from client; client displays `starsEarned` returned by server API
- [x] **POL-09**: `/api/daily-challenge/today` endpoint serves daily slug so client does not compute it locally

### Performance

- [x] **PERF-01**: `GET /api/kids/:id/home-summary` endpoint aggregates all KidHome data (progress, achievements, classrooms, daily challenge) into one response
- [x] **PERF-02**: `progressSync.upsertProgress` wrapped in single Prisma `$transaction` (reduce 3–4 sequential round-trips to 1)
- [x] **PERF-03**: Stats endpoint (`/api/progress/:kidId/stats`) refactored to single query (eliminate second full-table scan)
- [x] **PERF-04**: Weekly digest sends batched with `Promise.allSettled` in groups of 10 parents

### Monetization — Parent Subscriptions

- [x] **MON-01**: Free tier limits access to first 3 modules; remaining 10 modules require active premium subscription
- [x] **MON-02**: Stripe Checkout session created server-side for parent monthly ($4.99) and annual ($39.99) plans
- [x] **MON-03**: Stripe webhook handler processes `checkout.session.completed`, `customer.subscription.deleted`, and `invoice.payment_failed` events
- [x] **MON-04**: Parent subscription management page shows plan status, next billing date, and links to Stripe billing portal for changes/cancellation
- [x] **MON-05**: Paywall UI shown to kid when attempting locked module; parent receives in-app notification and email nudge
- [x] **MON-06**: 7-day free trial granted automatically on first parent signup; Stripe trial period configured server-side

### Monetization — School Licensing

- [x] **SCH-01**: School entity added to DB with name, seat count, license expiry date, and Stripe customer ID
- [x] **SCH-02**: School admin role can purchase a seat license via Stripe Checkout (annual pricing per seat or flat-rate tiers)
- [x] **SCH-03**: Teachers provisioned under a school; classrooms created by school teachers count against school seat allocation
- [x] **SCH-04**: Kids in school-licensed classrooms have all modules unlocked regardless of parent subscription status
- [x] **SCH-05**: School admin dashboard shows seats used, renewal date, and downloadable invoice history
- [x] **SCH-06**: Stripe webhook handler for school license events (purchase, renewal, expiry)

### Adaptive Learning

- [x] **ADL-01**: `ModuleDifficulty` and `ReviewSchedule` tables (already migrated) wired to record difficulty level per kid per module based on score history
- [x] **ADL-02**: KidHome displays smart module recommendations derived from difficulty data (surface modules where kid scored 60–80%, not already mastered)
- [x] **ADL-03**: Review scheduler surfaces lessons below 60% score in a "Review Today" section on KidHome

### Analytics & Observability

- [x] **OBS-01**: Sentry SDK integrated on client (`@sentry/react`) and server (`@sentry/node`) with DSN configured via env vars
- [ ] **OBS-02**: Parent dashboard enhanced with time-on-app chart, lessons-per-day histogram, and per-module star trends
- [ ] **OBS-03**: Teacher dashboard enhanced with class-level performance metrics: average stars per module, completion rates, struggling kids flagged

## v2 Requirements

### Growth
- **GRW-01**: Referral program — parent earns 1 free month for each referred parent who converts
- **GRW-02**: Social share card generated on module completion (shareable image with kid's score)
- **GRW-03**: Email onboarding sequence (Day 1, Day 3, Day 7) for new parent signups

### Content
- **CONT-01**: Admin content management — add new modules/lessons without a code deploy
- **CONT-02**: Localization framework — support Spanish as second language

### Platform
- **PLAT-01**: Native mobile app (React Native) sharing the same backend
- **PLAT-02**: Bulk CSV import for school admins to provision students

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multiplayer | High complexity, no demand signal |
| Video content | Storage/bandwidth costs prohibitive at current scale |
| iOS/Android native app | PWA covers this; v2 consideration |
| AI-generated content | Out of scope until content library saturated |
| In-app chat/messaging | Child safety/moderation overhead not justified |
| Per-lesson microtransactions | Too granular; subscription model simpler |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 — Security Hardening | Complete |
| SEC-02 | Phase 1 — Security Hardening | Complete |
| SEC-03 | Phase 1 — Security Hardening | Complete |
| SEC-04 | Phase 1 — Security Hardening | Complete |
| SEC-05 | Phase 1 — Security Hardening | Complete |
| SEC-06 | Phase 1 — Security Hardening | Complete |
| POL-01 | Phase 2 — Polish & UX | Complete |
| POL-02 | Phase 2 — Polish & UX | Complete |
| POL-03 | Phase 2 — Polish & UX | Complete |
| POL-04 | Phase 2 — Polish & UX | Complete |
| POL-05 | Phase 2 — Polish & UX | Complete |
| POL-06 | Phase 2 — Polish & UX | Complete |
| POL-07 | Phase 2 — Polish & UX | Complete |
| POL-08 | Phase 2 — Polish & UX | Complete |
| POL-09 | Phase 2 — Polish & UX | Complete |
| PERF-01 | Phase 3 — Performance | Complete |
| PERF-02 | Phase 3 — Performance | Complete |
| PERF-03 | Phase 3 — Performance | Complete |
| PERF-04 | Phase 3 — Performance | Complete |
| MON-01 | Phase 4 — Parent Subscriptions | Complete |
| MON-02 | Phase 4 — Parent Subscriptions | Complete |
| MON-03 | Phase 4 — Parent Subscriptions | Complete |
| MON-04 | Phase 4 — Parent Subscriptions | Complete |
| MON-05 | Phase 4 — Parent Subscriptions | Complete |
| MON-06 | Phase 4 — Parent Subscriptions | Complete |
| SCH-01 | Phase 5 — School Licensing | Complete |
| SCH-02 | Phase 5 — School Licensing | Complete |
| SCH-03 | Phase 5 — School Licensing | Complete |
| SCH-04 | Phase 5 — School Licensing | Complete |
| SCH-05 | Phase 5 — School Licensing | Complete |
| SCH-06 | Phase 5 — School Licensing | Complete |
| ADL-01 | Phase 6 — Adaptive Learning | Complete |
| ADL-02 | Phase 6 — Adaptive Learning | Complete |
| ADL-03 | Phase 6 — Adaptive Learning | Complete |
| OBS-01 | Phase 7 — Analytics & Observability | Complete |
| OBS-02 | Phase 7 — Analytics & Observability | Pending |
| OBS-03 | Phase 7 — Analytics & Observability | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability expanded to individual rows after roadmap creation*
