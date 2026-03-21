---
phase: 04-parent-subscriptions
verified: 2026-03-21T10:00:00Z
status: human_needed
score: 18/18 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 17/18
  gaps_closed:
    - "Paywall UI shown to kid when attempting locked module; parent receives in-app notification AND email nudge"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Subscription UI end-to-end: trialing, none/canceled, active, past_due states"
    expected: "ParentDashboard shows correct banner/section for each subscription state; plan picker renders with radio selection; toasts fire on checkout return"
    why_human: "Visual rendering and state transitions cannot be verified programmatically"
  - test: "KidHome locked module rendering"
    expected: "Modules 4-13 appear at 0.45 opacity with a lock icon in the corner when parent is not premium; alphabet/numbers/shapes render normally at full opacity"
    why_human: "Opacity and visual overlay appearance require browser rendering"
  - test: "Active subscriber view in ParentDashboard"
    expected: "SubscriptionSection shows 'Premium Plan' heading, 'Active' green pill, next billing date, and 'Manage billing' button — no upgrade banner, no plan picker"
    why_human: "Requires DB state change and visual inspection"
  - test: "Stripe Checkout redirect flow (requires Stripe test keys configured)"
    expected: "Clicking Subscribe redirects to Stripe Checkout; returning with ?checkout=success shows 'Subscription activated!' toast and URL param is cleaned"
    why_human: "Requires live Stripe test environment and actual HTTP redirects"
  - test: "Upgrade nudge email delivered when kid hits locked module"
    expected: "Parent receives email with subject 'Your child tried to access a premium module on KidsLearn'; second attempt within 24h is rate-limited (no duplicate email)"
    why_human: "Requires real Resend API key, live email delivery, and 24h rate-limit testing"
---

# Phase 4: Parent Subscriptions Verification Report

**Phase Goal:** Parents can subscribe, be billed automatically, and manage their subscription — the app earns recurring revenue.
**Verified:** 2026-03-21T10:00:00Z
**Status:** human_needed — all 18 automated checks pass; 5 items require browser/live-API human testing
**Re-verification:** Yes — after gap closure (email nudge for MON-05)

## Re-Verification Summary

Previous verification (2026-03-21T03:00:00Z) found 1 gap: no email nudge was triggered when a kid encountered a locked module gate. That gap is now closed:

- `server/src/services/upgradeNudge.js` — new 97-line service using Resend; sends styled HTML email; 24h per-parent rate limiting via `lastNudgeEmailAt`
- `server/prisma/schema.prisma` — `lastNudgeEmailAt DateTime?` field added to User model
- `server/src/routes/progress.js` — `sendUpgradeNudge` imported and called fire-and-forget at the 403 gate (line 213)
- `server/tests/monetization/mon05-email-nudge.test.js` — 5 tests covering: first nudge (never nudged), nudge after 24h elapsed, rate-limit block within 24h, DB update after send, graceful skip when RESEND_API_KEY absent

Regression check: all 17 previously verified artifacts remain substantive (no line-count regressions; key wiring intact).

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A new parent who registers gets subscriptionStatus='trialing' and trialEndsAt 7 days in the future | VERIFIED | auth.js create block sets both fields; MON-06 tests confirm |
| 2 | An existing parent who re-registers does not get their trialEndsAt reset | VERIFIED | auth.js update block contains only email/name/role; MON-06 test asserts no subscription fields in update block |
| 3 | home-summary response includes isPremium boolean and subscription object | VERIFIED | kids.js:147,166-170 — isPremium computed, subscription object with status/trialEndsAt/subscriptionEnd returned |
| 4 | isPremium is true when subscriptionStatus is active OR trialing with trialEndsAt in the future | VERIFIED | subscriptionUtils.js:3-7 — exact logic; MON-01 tests for active (pass) and trialing-future (pass) |
| 5 | isPremium is false when trial expired or subscriptionStatus is none/canceled/past_due | VERIFIED | subscriptionUtils.js:8 — fallback false; MON-01 tests for trialing-expired and none (both pass) |
| 6 | A parent can create a Stripe Checkout session for monthly or annual plan | VERIFIED | billing.js:8-56 — PLAN_TO_PRICE mapping, sessions.create call; 4 MON-02 tests pass |
| 7 | An unknown plan name is rejected with 400 | VERIFIED | billing.js:19-21 — priceId null guard; MON-02 test for 'enterprise_garbage' passes |
| 8 | checkout.session.completed webhook sets subscriptionStatus=active, stores stripeCustomerId/stripeSubscriptionId, clears trialEndsAt | VERIFIED | billing.js:90-104 — full update block; MON-03 test asserts all four fields |
| 9 | customer.subscription.deleted webhook sets subscriptionStatus=canceled | VERIFIED | billing.js:106-115 — updateMany with canceled + subscriptionEnd; MON-03 test passes |
| 10 | invoice.payment_failed webhook sets subscriptionStatus=past_due | VERIFIED | billing.js:117-124 — updateMany with past_due; MON-03 test passes |
| 11 | Invalid webhook signature returns 400 | VERIFIED | billing.js:82-86 — constructEvent throws caught to 400; MON-03 test passes |
| 12 | A parent with an active subscription can get a Stripe billing portal URL | VERIFIED | billing.js:59-75 — billingPortal.sessions.create; MON-04 test passes |
| 13 | A parent without stripeCustomerId gets 400 when requesting portal | VERIFIED | billing.js:63-65 — explicit guard; MON-04 test passes |
| 14 | Progress writes for locked modules are rejected with 403 when parent is not premium | VERIFIED | progress.js:205-212 — FREE_MODULE_SLUGS gate with 403; MON-01 progress-gate test passes |
| 15 | Progress writes for free modules succeed regardless of subscription status | VERIFIED | progress.js:205 — `!FREE_MODULE_SLUGS.includes(lesson.module.slug)` check; MON-01 free-module test passes |
| 16 | Non-premium parent sees an upgrade banner in ParentDashboard | VERIFIED | ParentDashboard.jsx:310-325 — trialing/none/canceled states render banner with Upgrade Now button |
| 17 | Locked modules in KidHome render at 0.45 opacity with pointer-events none and a lock icon | VERIFIED | KidHome.jsx:154,162-163,179 — isLocked computed, opacity+pointerEvents applied, lock emoji conditionally rendered |
| 18 | Parent receives email nudge when kid encounters locked module; max 1 email per 24h per parent | VERIFIED | upgradeNudge.js — sendUpgradeNudge fires from progress.js gate (line 213) fire-and-forget; 24h rate limit via lastNudgeEmailAt; 5 MON-05 tests pass |

**Score:** 18/18 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/prisma/schema.prisma` | User model with 5 subscription fields + lastNudgeEmailAt | VERIFIED | stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionEnd, trialEndsAt, lastNudgeEmailAt all present |
| `server/src/lib/subscriptionUtils.js` | FREE_MODULE_SLUGS + isParentPremium | VERIFIED | 10 lines; exports both; FREE_MODULE_SLUGS=['alphabet','numbers','shapes']; isParentPremium has active + trialing-future logic |
| `server/src/routes/auth.js` | Trial init in register create block | VERIFIED | 145 lines; create block sets subscriptionStatus:'trialing' and trialEndsAt:+7days only |
| `server/src/routes/kids.js` | home-summary with isPremium + subscription | VERIFIED | isParentPremium imported, parent queried in Promise.all, isPremium+subscription in res.json() |
| `server/src/routes/billing.js` | Checkout, webhook, portal endpoints | VERIFIED | 136 lines; all three endpoints present and substantive; PLAN_TO_PRICE mapping; webhookHandler exported |
| `server/src/index.js` | Webhook before express.json(), billing router | VERIFIED | Webhook mounted with express.raw() before express.json(); billing router registered |
| `server/src/routes/progress.js` | Module gate with 403 + fire-and-forget nudge | VERIFIED | FREE_MODULE_SLUGS+isParentPremium+sendUpgradeNudge all imported; gate at lines 205-215 with nudge call |
| `server/src/services/upgradeNudge.js` | Email nudge service with rate limiting | VERIFIED | 97 lines; Resend send; 24h lastNudgeEmailAt rate limit; DB update after send; graceful skip if no API key |
| `client/src/pages/ParentDashboard.jsx` | SubscriptionSection with all states | VERIFIED | 649 lines; active/trialing/none+canceled/past_due states, plan picker (radiogroup), handleCheckout/handleManageBilling, toasts |
| `client/src/pages/KidHome.jsx` | Locked ModuleCard overlay | VERIFIED | 482 lines; FREE_MODULE_SLUGS constant, isPremium state (default true), isLocked computed, opacity/pointerEvents/aria-disabled/lock emoji |
| `server/tests/monetization/mon01-module-gating.test.js` | 5 home-summary tests + 3 progress gate tests | VERIFIED | 8 tests covering all isPremium derivation cases and module gate scenarios |
| `server/tests/monetization/mon02-checkout-session.test.js` | 4 checkout tests | VERIFIED | monthly plan, annual plan, invalid plan (400), customer vs customer_email logic |
| `server/tests/monetization/mon03-webhook-handler.test.js` | 4 webhook tests | VERIFIED | all 3 event types and invalid signature |
| `server/tests/monetization/mon04-portal.test.js` | 2 portal tests | VERIFIED | valid customer (200 + url) and missing customer (400) |
| `server/tests/monetization/mon05-email-nudge.test.js` | 5 nudge service tests | VERIFIED | first nudge, nudge after 24h, rate-limit block, DB update after send, graceful skip without RESEND_API_KEY |
| `server/tests/monetization/mon06-trial-init.test.js` | 2 trial init tests | VERIFIED | create-block (subscriptionStatus+trialEndsAt present) and update-block (no subscription fields) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| server/src/routes/auth.js | prisma.user.upsert create block | subscriptionStatus + trialEndsAt in create only | WIRED | Create has both fields; update block has only email/name/role |
| server/src/routes/kids.js | server/src/lib/subscriptionUtils.js | isParentPremium import | WIRED | Line 5: `const { isParentPremium } = require('../lib/subscriptionUtils')` |
| server/src/index.js | server/src/routes/billing.js webhookHandler | app.post before express.json() | WIRED | Webhook mounted with express.raw() before express.json() |
| server/src/routes/billing.js | stripe.checkout.sessions.create | Stripe SDK | WIRED | Line 51: `stripe.checkout.sessions.create(sessionParams)` |
| server/src/routes/progress.js | server/src/lib/subscriptionUtils.js | FREE_MODULE_SLUGS + isParentPremium imports | WIRED | Line 5: both destructured; used in gate at lines 205-212 |
| server/src/routes/progress.js | server/src/services/upgradeNudge.js | sendUpgradeNudge fire-and-forget at 403 gate | WIRED | Line 6: imported; line 213: `sendUpgradeNudge(kid.parentId).catch(...)` before 403 return |
| server/src/services/upgradeNudge.js | prisma.user.findUnique + prisma.user.update | lastNudgeEmailAt rate-limit read + write | WIRED | findUnique reads lastNudgeEmailAt; update writes it after successful send |
| client/src/pages/ParentDashboard.jsx | /api/billing/checkout | api.post | WIRED | `api.post('/api/billing/checkout', { plan: selectedPlan })` |
| client/src/pages/ParentDashboard.jsx | /api/billing/portal | api.get | WIRED | `api.get('/api/billing/portal')` |
| client/src/pages/KidHome.jsx | home-summary response | isPremium field from API | WIRED | `setIsPremium(data.isPremium ?? true)` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MON-01 | 04-01, 04-02 | Free tier limits access to first 3 modules; remaining 10 require active premium | SATISFIED | progress.js module gate (403 for non-premium on locked modules); home-summary isPremium derivation; 8 tests passing |
| MON-02 | 04-02 | Stripe Checkout session created server-side for monthly ($4.99) and annual ($39.99) plans | SATISFIED | billing.js /checkout with PLAN_TO_PRICE mapping; 4 MON-02 tests passing |
| MON-03 | 04-02 | Stripe webhook handler processes checkout.session.completed, customer.subscription.deleted, invoice.payment_failed | SATISFIED | billing.js webhookHandler switch statement; 4 MON-03 tests for all 3 event types + invalid signature |
| MON-04 | 04-02 | Parent subscription management page shows plan status, next billing date, and links to Stripe billing portal | SATISFIED | ParentDashboard SubscriptionSection active-state shows plan status + nextBilling date + Manage billing button to portal |
| MON-05 | 04-03 | Paywall UI shown to kid when attempting locked module; parent receives in-app notification and email nudge | SATISFIED | KidHome locked overlay implemented; ParentDashboard upgrade banners for all non-active states; upgradeNudge.js sends email via Resend when kid hits 403; 5 MON-05 tests passing |
| MON-06 | 04-01 | 7-day free trial granted automatically on first parent signup; Stripe trial period configured server-side | SATISFIED | auth.js register create block sets subscriptionStatus:'trialing' + trialEndsAt:+7days; checkout computes remaining trialDays; 2 MON-06 tests passing |

**Orphaned requirements:** None — all 6 MON-XX IDs declared in plan frontmatter and all satisfied.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| server/src/routes/billing.js | 5 | `'sk_test_placeholder'` fallback for STRIPE_SECRET_KEY | Info | Intentional — prevents startup crash in test files that set their own key. Not a stub. |

No blocking anti-patterns found. upgradeNudge.js has proper error containment (`catch` on the fire-and-forget call; `try/catch` inside the service with `// Never throw` comment).

---

### Human Verification Required

#### 1. Subscription UI State Rendering

**Test:** Register a new parent account, go to ParentDashboard, observe the subscription section.
**Expected:** Banner reads "X days left in your free trial" with "Upgrade Now" button. Clicking shows plan picker with Monthly ($4.99/mo) and Annual ($39.99/yr) cards. Annual card has "Best value" badge. Clicking a card shows blue border selection. "Maybe later" dismisses picker.
**Why human:** Visual rendering, animation, and interaction states cannot be verified programmatically.

#### 2. KidHome Locked Module Rendering

**Test:** Log in as a kid whose parent has subscriptionStatus='none' (set via DB). View KidHome.
**Expected:** Modules 4-13 appear visually dimmed (0.45 opacity) with a lock icon in the corner. alphabet, numbers, shapes appear normal at full opacity.
**Why human:** Opacity and visual overlay appearance require browser rendering.

#### 3. Active Subscriber View

**Test:** Set a parent's subscriptionStatus='active' in DB. Reload ParentDashboard.
**Expected:** SubscriptionSection shows "Premium Plan" heading, "Active" green pill, a next billing date, and a "Manage billing" button. No upgrade banner. No plan picker.
**Why human:** Requires DB state change and visual inspection.

#### 4. Stripe Checkout Redirect Flow

**Test:** Configure STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY/ANNUAL env vars. Select monthly plan, click Subscribe. Complete checkout with Stripe test card 4242 4242 4242 4242. Observe redirect.
**Expected:** Browser redirects to Stripe Checkout. After payment, redirects to /parent?checkout=success. Toast "Subscription activated! All modules unlocked." fires and the URL param is cleaned from the address bar.
**Why human:** Requires live Stripe test environment and actual HTTP redirects.

#### 5. Upgrade Nudge Email Delivery

**Test:** Configure RESEND_API_KEY. Log in as a kid whose parent is non-premium. Attempt to complete progress on a locked module. Check parent's inbox.
**Expected:** Parent receives email with subject "Your child tried to access a premium module on KidsLearn" with an "Upgrade to Premium" CTA link. A second attempt within 24h produces no additional email (rate-limited).
**Why human:** Requires real Resend API key, live email delivery, and 24h rate-limit testing across time.

---

### Gap Closure Summary

The single gap from initial verification (MON-05 email nudge) is now fully closed:

- `server/src/services/upgradeNudge.js` exists (97 lines), is substantive (Resend send + DB rate-limit logic), and is wired — imported in progress.js and called fire-and-forget at the 403 gate.
- `lastNudgeEmailAt` field is present in schema.prisma ensuring persistence of the rate-limit timestamp across restarts.
- 5 unit tests in mon05-email-nudge.test.js cover all behavioral cases including the rate-limit boundary.

All 18 observable truths are now verified. The phase goal is achieved in code. Remaining items are human/live-environment verification only.

---

_Verified: 2026-03-21T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
