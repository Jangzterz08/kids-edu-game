# Phase 4: Parent Subscriptions - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Parents can subscribe to KidsLearn, be billed automatically via Stripe, and manage their plan in-app. Kids get module access gated by subscription status. This phase delivers: freemium gating, Stripe Checkout, webhook handling, subscription state in DB, paywall UI, and parent billing management. School licensing, adaptive learning, and analytics are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Module Gating Enforcement
- **Hybrid enforcement**: `home-summary` response includes `isPremium` flag; client uses it to gray out locked `ModuleCard`s (not tappable); server also validates on lesson save — rejects progress writes for locked modules as a safety net
- **Free modules are hardcoded**: slugs `['alphabet', 'numbers', 'shapes']` defined as a constant server-side. No DB config, no env var. Change requires a deploy.
- **Trial = full access**: during the 7-day free trial, all 13 modules are unlocked. Trial expiry triggers the lock to modules 4-13.

### Paywall Screen (Kid UX)
- **Locked ModuleCards**: rendered with 🔒 icon overlay and reduced opacity; `pointer-events: none` — kids cannot tap them. No paywall screen, no navigation — just visual lock.
- **Parent nudge is passive, not real-time**:
  - Persistent "Upgrade to unlock all 13 modules" banner/card at the top of `ParentDashboard` for any parent who is not `active` subscriber
  - One-time trial-end email sent when Stripe webhook fires `customer.subscription.deleted` or when trial expires — triggered by webhook, not by kid activity

### Subscription State Storage
- **New fields on existing `User` table** (Prisma migration required):
  - `stripeCustomerId` — String, nullable, unique
  - `stripeSubscriptionId` — String, nullable, unique
  - `subscriptionStatus` — Enum: `none | trialing | active | canceled | past_due`
  - `subscriptionEnd` — DateTime, nullable (when active sub expires or canceled sub ends)
  - `trialEndsAt` — DateTime, nullable
- **No separate Subscription model** — one subscription per parent, fields on User is sufficient for Phase 4
- **Client access to status**: `home-summary` endpoint (`GET /api/kids/:id/home-summary`) adds `subscription: { status, trialEndsAt, subscriptionEnd }` to its response. KidHome reads this to determine `isPremium` for card rendering.
- **Trial starts at signup**: `POST /api/auth/register` sets `trialEndsAt = now() + 7 days` and `subscriptionStatus = 'trialing'`. No Stripe interaction required for trial start. Stripe `trial_period_days` is configured to match (7 days) when parent eventually subscribes.

### Parent Billing UI
- **Location**: New "Subscription" section inside `ParentDashboard.jsx` — not a separate route. Lives alongside the existing kid progress tabs.
- **What it shows**:
  - Plan label: Free / Trial (N days left) / Monthly / Annual
  - Next billing date or trial end date
  - Price ($4.99/mo or $39.99/yr)
- **Actions**:
  - Non-subscriber / post-trial: "Upgrade" → in-app plan picker → Stripe Checkout
  - Active subscriber: "Manage billing" → redirect to Stripe Customer Portal (handles cancel/change)
- **In-app plan picker**: two cards shown before Stripe Checkout — Monthly ($4.99/mo) vs Annual ($39.99/yr, saves 33%). Parent selects, server creates Stripe Checkout session for that `priceId`, client redirects to Stripe-hosted checkout page. No in-app payment form.

### Claude's Discretion
- Exact visual design of the locked ModuleCard overlay (opacity level, lock icon size)
- Stripe Checkout success/cancel redirect URLs
- Email template copy for the trial-end email
- Error state handling if Stripe Checkout session creation fails

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MON-01 through MON-06 define all acceptance criteria for this phase. Read before planning tasks.
- `.planning/ROADMAP.md` §Phase 4 — Success criteria (5 must-be-true statements) define the verification targets.

### Existing code (integration points)
- `server/src/routes/auth.js` — `POST /api/auth/register` is where `trialEndsAt` and `subscriptionStatus` initialization must be added
- `server/src/routes/kids.js` — `GET /:kidId/home-summary` is where `subscription` field must be added to the response
- `client/src/pages/ParentDashboard.jsx` — Subscription section is added here
- `client/src/pages/KidHome.jsx` — `ModuleCard` rendering must check `isPremium` from home-summary response
- `server/src/lib/db.js` — Prisma client used by all routes; new User fields must be migrated before any route uses them

### No external specs
No external Stripe integration spec exists in this repo. Stripe SDK docs and Prisma migration patterns are the authoritative references during research.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/pages/ParentDashboard.jsx` — Already has kid selector tabs; subscription section slots in as a new top-level card before the kid tabs
- `GET /api/kids/:id/home-summary` (Phase 3) — Already aggregates KidHome data; extend its response with `subscription` field rather than adding a new endpoint
- `POST /api/auth/register` — Existing upsert logic; add `trialEndsAt` and `subscriptionStatus` initialization here on `create` path only (not `update`)
- `server/src/middleware/auth.js` (`requireAuth`) — Already validates Supabase JWT and sets `req.user`; subscription check logic can be a separate middleware or inline in the lesson/progress routes

### Established Patterns
- **Prisma migrations**: project uses `prisma migrate dev` (Supabase PostgreSQL, `kids_edu_game` schema)
- **Server route pattern**: `try/catch` + `next(err)`, returns JSON; all protected routes use `requireAuth`
- **Client data fetching**: direct `api.get/post` calls in `useEffect` inside page components — no external state library
- **Enum values in Prisma**: existing schema uses string-based fields; add `subscriptionStatus` as a `String` with application-level enum validation (no native Prisma enum needed to avoid migration complexity)

### Integration Points
- `server/src/index.js` — Stripe webhook endpoint must be registered BEFORE `express.json()` middleware (Stripe requires raw body for signature verification)
- `client/src/App.jsx` — `ProtectedRoute` system; no new route needed for billing (embedded in ParentDashboard)
- `server/src/routes/progress.js` — Lesson save route must check `subscriptionStatus` against the free module list before calling `upsertProgress`

</code_context>

<specifics>
## Specific Ideas

- Locked modules: 🔒 icon + ~40% opacity on the ModuleCard — visually clear without being alarming for young kids
- Plan picker: two side-by-side cards, annual plan highlighted with a "Best value" badge
- Trial countdown: show "X days left in your trial" in the subscription section — creates gentle urgency without being aggressive
- Stripe Customer Portal handles all cancel/change flows — no need to build that in-app

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope. School licensing (Phase 5) and any referral/growth mechanics (v2) were not raised.

</deferred>

---

*Phase: 04-parent-subscriptions*
*Context gathered: 2026-03-21*
