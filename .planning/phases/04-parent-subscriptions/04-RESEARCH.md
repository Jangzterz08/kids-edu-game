# Phase 4: Parent Subscriptions - Research

**Researched:** 2026-03-21
**Domain:** Stripe Subscriptions, Prisma migration, Express webhook, React paywall UI
**Confidence:** HIGH (core Stripe patterns are well-established; project-specific integration points verified from source)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module Gating Enforcement**
- Hybrid enforcement: `home-summary` response includes `isPremium` flag; client uses it to gray out locked `ModuleCard`s (not tappable); server also validates on lesson save — rejects progress writes for locked modules as a safety net
- Free modules are hardcoded: slugs `['alphabet', 'numbers', 'shapes']` defined as a constant server-side. No DB config, no env var. Change requires a deploy.
- Trial = full access: during the 7-day free trial, all 13 modules are unlocked. Trial expiry triggers the lock to modules 4-13.

**Paywall Screen (Kid UX)**
- Locked ModuleCards: rendered with lock icon overlay and reduced opacity; `pointer-events: none` — kids cannot tap them. No paywall screen, no navigation — just visual lock.
- Parent nudge is passive, not real-time:
  - Persistent "Upgrade to unlock all 13 modules" banner/card at the top of `ParentDashboard` for any parent who is not `active` subscriber
  - One-time trial-end email sent when Stripe webhook fires `customer.subscription.deleted` or when trial expires — triggered by webhook, not by kid activity

**Subscription State Storage**
- New fields on existing `User` table (Prisma migration required):
  - `stripeCustomerId` — String, nullable, unique
  - `stripeSubscriptionId` — String, nullable, unique
  - `subscriptionStatus` — String field with application-level enum: `none | trialing | active | canceled | past_due`
  - `subscriptionEnd` — DateTime, nullable
  - `trialEndsAt` — DateTime, nullable
- No separate Subscription model — one subscription per parent, fields on User is sufficient for Phase 4
- Client access to status: `home-summary` endpoint adds `subscription: { status, trialEndsAt, subscriptionEnd }` to its response
- Trial starts at signup: `POST /api/auth/register` sets `trialEndsAt = now() + 7 days` and `subscriptionStatus = 'trialing'`. No Stripe interaction required for trial start.

**Parent Billing UI**
- Location: New "Subscription" section inside `ParentDashboard.jsx` — not a separate route
- What it shows: Plan label (Free / Trial N days left / Monthly / Annual), next billing date or trial end date, price ($4.99/mo or $39.99/yr)
- Actions: Non-subscriber/post-trial → "Upgrade" → in-app plan picker → Stripe Checkout; Active subscriber → "Manage billing" → Stripe Customer Portal
- In-app plan picker: two cards (Monthly vs Annual) before Stripe Checkout; server creates Checkout session for chosen priceId; client redirects to Stripe-hosted page. No in-app payment form.

**Claude's Discretion**
- Exact visual design of the locked ModuleCard overlay (opacity level, lock icon size)
- Stripe Checkout success/cancel redirect URLs
- Email template copy for the trial-end email
- Error state handling if Stripe Checkout session creation fails

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 4 scope. School licensing (Phase 5) and any referral/growth mechanics (v2) were not raised.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MON-01 | Free tier limits access to first 3 modules; remaining 10 modules require active premium subscription | FREE_MODULE_SLUGS constant server-side; `isPremium` derived from `subscriptionStatus` + `trialEndsAt`; progress route rejects writes for locked modules |
| MON-02 | Stripe Checkout session created server-side for parent monthly ($4.99) and annual ($39.99) plans | `stripe.checkout.sessions.create()` with `mode: 'subscription'`, two Price IDs from Stripe dashboard; redirect URLs passed from client or configured server-side |
| MON-03 | Stripe webhook handler processes `checkout.session.completed`, `customer.subscription.deleted`, and `invoice.payment_failed` events | Raw-body middleware required before `express.json()`; `stripe.webhooks.constructEvent()` for signature verification; update User fields per event type |
| MON-04 | Parent subscription management page shows plan status, next billing date, and links to Stripe billing portal | `stripe.billingPortal.sessions.create()` returns a one-time URL; `GET /api/billing/portal` endpoint; displayed in ParentDashboard Subscription section |
| MON-05 | Paywall UI shown to kid when attempting locked module; parent receives in-app notification and email nudge | `isPremium` from home-summary drives ModuleCard lock rendering; upgrade banner in ParentDashboard; trial-end email via Resend (already installed) on webhook event |
| MON-06 | 7-day free trial granted automatically on first parent signup; Stripe trial period configured server-side | Trial set in `register` route on `create` path; Stripe `trial_period_days: 7` on Checkout session so billing aligns if parent subscribes mid-trial |
</phase_requirements>

---

## Summary

Phase 4 adds a complete Stripe subscription system to KidsLearn. The server gains three new capabilities: (1) a Prisma migration adding 5 subscription fields to the `User` table, (2) two new API routes (`POST /api/billing/checkout` and `GET /api/billing/portal`) plus a webhook endpoint, and (3) subscription-aware logic in the existing `register` and `home-summary` routes. The client gains a Subscription section in `ParentDashboard` with a plan picker and a locked-module visual treatment in `KidHome`.

The key architectural constraint is the webhook endpoint: Stripe requires the raw HTTP body for HMAC signature verification, which means the webhook route **must be registered before `express.json()` in `index.js`**. This is the most common implementation error. Everything else — Checkout sessions, the Customer Portal, trial logic — follows straightforward Stripe patterns with no exotic edge cases.

The existing stack is well-prepared: `resend` is already installed for the trial-end email, `prisma` migrations are in place, and the test pattern (`vi.spyOn(global.prisma)` with `supertest`) is established. Stripe SDK version 20.4.1 is current as of 2026-03.

**Primary recommendation:** Install `stripe` npm package, run a single Prisma migration, then build in this order: migration → register-route trial init → home-summary subscription field → billing routes → webhook → ParentDashboard UI → KidHome lock rendering → progress-route gate.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.4.1 | Stripe Node.js SDK — Checkout, Portal, webhook verification | Official Stripe SDK; only supported way to call Stripe APIs from Node |
| @prisma/client | already installed | ORM for User subscription fields | Already used throughout the project |
| resend | already installed | Trial-end email | Already installed in server; used for weekly digest |

**Version verification:** `npm view stripe version` returns `20.4.1` (verified 2026-03-21).

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| express (raw body) | already installed | Raw body capture for webhook signature verification | Required for `POST /api/billing/webhook` before `express.json()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout (hosted page) | Stripe Elements (in-app form) | Elements gives more design control but requires PCI scope; Checkout is faster and locked decision |
| Fields on User model | Separate Subscription model | Separate model is more extensible for Phase 5 school licensing, but locked decision says User fields are sufficient for Phase 4 |

**Installation:**
```bash
cd /Users/Ja_Jang/Application/kids-edu-game/server
npm install stripe@20.4.1
```

---

## Architecture Patterns

### Recommended Project Structure

New files for Phase 4:

```
server/
├── src/
│   ├── routes/
│   │   └── billing.js          # POST /checkout, GET /portal, POST /webhook
│   └── index.js                # webhook registered BEFORE express.json()
├── prisma/
│   └── migrations/
│       └── 20260321_add_subscription_fields/  # stripeCustomerId etc.
└── tests/
    └── monetization/
        ├── mon01-module-gating.test.js
        ├── mon02-checkout-session.test.js
        ├── mon03-webhook-handler.test.js
        └── mon06-trial-init.test.js

client/
└── src/
    └── pages/
        ├── ParentDashboard.jsx   # add SubscriptionSection component
        └── KidHome.jsx           # add isPremium check to ModuleCard rendering
```

### Pattern 1: Webhook Raw Body Before express.json()

**What:** Stripe webhook signature verification requires the raw (unparsed) request body. Express's `express.json()` middleware replaces `req.body` with a parsed object. The webhook route must receive raw bytes.

**When to use:** Always, for any Stripe webhook endpoint.

**Example:**
```javascript
// In server/src/index.js — BEFORE app.use(express.json())
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/billing').webhookHandler
);

// THEN the existing json middleware applies to all other routes
app.use(express.json());
```

Critical: the webhook route must be mounted as a standalone `app.post(...)` call, not via `app.use('/api/billing', router)` if the router also has JSON-parsed routes — or the raw body middleware must be applied route-specifically.

### Pattern 2: Derive isPremium Server-Side

**What:** `isPremium` is a boolean derived from `subscriptionStatus` and `trialEndsAt`. It is computed on the server and included in the `home-summary` response. The client never computes it.

**Example:**
```javascript
// Derive in home-summary handler
function isParentPremium(user) {
  if (user.subscriptionStatus === 'active') return true;
  if (user.subscriptionStatus === 'trialing' && user.trialEndsAt > new Date()) return true;
  return false;
}
```

The `home-summary` handler already performs `resolveKidAccess` which returns the `KidProfile`. To get the parent's subscription status, it must do one additional `prisma.user.findUnique` on the kid's `parentId`. This is a single extra query added to the existing `Promise.all` block.

### Pattern 3: Stripe Checkout Session Creation

**What:** Server creates a Checkout session server-side and returns the session URL to the client, which redirects the browser.

**Example:**
```javascript
// POST /api/billing/checkout
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer_email: dbUser.email,  // or customer: dbUser.stripeCustomerId if exists
  line_items: [{ price: priceId, quantity: 1 }],
  trial_period_days: dbUser.subscriptionStatus === 'trialing' ? daysRemainingInTrial(dbUser.trialEndsAt) : undefined,
  subscription_data: {
    trial_period_days: 7,  // only for new customers; Stripe deducts if trial already started
  },
  success_url: `${process.env.CLIENT_ORIGIN}/parent?checkout=success`,
  cancel_url:  `${process.env.CLIENT_ORIGIN}/parent?checkout=cancel`,
  metadata: { userId: dbUser.id },
});
res.json({ url: session.url });
```

The client then does: `window.location.href = data.url`.

### Pattern 4: Webhook Event Handling

**What:** Three Stripe events must be handled. Each updates User fields in the DB.

**Example:**
```javascript
// POST /api/billing/webhook (raw body)
const sig = req.headers['stripe-signature'];
let event;
try {
  event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
} catch (err) {
  return res.status(400).send(`Webhook Error: ${err.message}`);
}

switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object;
    await prisma.user.update({
      where: { id: session.metadata.userId },
      data: {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        subscriptionStatus: 'active',
        trialEndsAt: null,
      },
    });
    break;
  }
  case 'customer.subscription.deleted': {
    const sub = event.data.object;
    await prisma.user.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { subscriptionStatus: 'canceled', subscriptionEnd: new Date(sub.ended_at * 1000) },
    });
    // Also send trial-end email via Resend if this was a trial cancellation
    break;
  }
  case 'invoice.payment_failed': {
    const invoice = event.data.object;
    await prisma.user.updateMany({
      where: { stripeCustomerId: invoice.customer },
      data: { subscriptionStatus: 'past_due' },
    });
    break;
  }
}
res.json({ received: true });
```

### Pattern 5: Stripe Customer Portal Session

**What:** Server creates a one-time Customer Portal URL and returns it to the client, which opens it in a new tab or redirects.

**Example:**
```javascript
// GET /api/billing/portal
const portalSession = await stripe.billingPortal.sessions.create({
  customer: dbUser.stripeCustomerId,
  return_url: `${process.env.CLIENT_ORIGIN}/parent`,
});
res.json({ url: portalSession.url });
```

The Customer Portal must be configured in the Stripe Dashboard (Business settings > Customer portal) before this works. This is a manual setup step, not a code step.

### Pattern 6: Progress Route Module Gate

**What:** `POST /api/progress/:kidId/lesson/:lessonSlug` must reject progress writes for locked modules.

**Example:**
```javascript
const FREE_MODULE_SLUGS = ['alphabet', 'numbers', 'shapes'];

// In the lesson write handler, after resolving the lesson:
const moduleSlug = lesson.moduleSlug; // need to join Module or use lesson.module.slug
if (!FREE_MODULE_SLUGS.includes(moduleSlug)) {
  // Check parent's subscription
  const parent = await prisma.user.findUnique({ where: { id: kid.parentId } });
  if (!isParentPremium(parent)) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
}
```

Note: `progress.js` currently resolves a `Lesson` by slug but does not include `module`. The query must be extended: `prisma.lesson.findFirst({ where: { slug }, include: { module: true } })`.

### Anti-Patterns to Avoid

- **Verifying webhook signatures on parsed body:** Calling `express.json()` before the webhook route destroys the raw body. Always mount the webhook route before `app.use(express.json())`.
- **Trusting client-supplied priceId without validation:** The server must validate that the supplied `priceId` matches one of the two known price IDs (monthly or annual). Never create a Checkout session for an arbitrary price.
- **Storing Stripe prices in the DB:** Price IDs (`price_xxxx`) are environment config, not database config. Store as env vars `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`.
- **Computing isPremium on the client:** The client has no authoritative way to know if a subscription is current. Always derive from server-returned `subscription.status`.
- **Using `customer_email` when a Stripe customer already exists:** If `stripeCustomerId` is already set on the User, pass `customer: dbUser.stripeCustomerId` instead of `customer_email` to avoid duplicate Stripe customers.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC logic | `stripe.webhooks.constructEvent()` | Timing-safe comparison, handles base64 encoding, replay protection |
| Subscription billing logic | Custom billing scheduler | Stripe — recurring billing, retries, dunning | Retry logic, failed payment emails, grace periods are all Stripe-managed |
| Payment form | Custom card input | Stripe Checkout (hosted page) | PCI compliance, 3DS handling, Apple Pay/Google Pay support |
| Customer portal | Custom cancel/change flow | `stripe.billingPortal.sessions.create()` | Invoice history, plan changes, payment method updates — all handled by Stripe |
| Trial expiry checking | Cron job comparing dates | Stripe `customer.subscription.trial_will_end` and `customer.subscription.deleted` webhooks | Stripe fires the event at the right time; no polling needed |

**Key insight:** Stripe manages the entire billing lifecycle. The server's job is to (1) create Checkout sessions and (2) react to webhook events by updating the DB. Everything else — billing, retries, emails to the paying customer, cancellations — happens in Stripe.

---

## Common Pitfalls

### Pitfall 1: Raw Body Lost Before Webhook
**What goes wrong:** `express.json()` consumes the request body stream; `stripe.webhooks.constructEvent()` receives an empty or object body and throws `No signatures found matching the expected signature for payload`.
**Why it happens:** The webhook route is added after `app.use(express.json())` in `index.js`.
**How to avoid:** In `index.js`, register `app.post('/api/billing/webhook', express.raw(...), handler)` as the very first route, before `app.use(express.json())`.
**Warning signs:** Webhook works in Stripe CLI local test but fails in production; `stripe-signature` header is present but verification fails.

### Pitfall 2: Duplicate Stripe Customers
**What goes wrong:** Every Checkout session call creates a new Stripe Customer, resulting in multiple customers per email address.
**Why it happens:** Using `customer_email` when `stripeCustomerId` is already stored on the User row.
**How to avoid:** Check `dbUser.stripeCustomerId` before creating the Checkout session. If set, pass `customer: dbUser.stripeCustomerId`. If not set, pass `customer_email: dbUser.email` (Stripe will create and return the customer ID in the `checkout.session.completed` webhook).

### Pitfall 3: isPremium Not Included in home-summary for Kid JWT Calls
**What goes wrong:** When a kid logs in with a kid JWT, `resolveKidAccess` returns the KidProfile but does not look up the parent's subscription status. The `isPremium` field is missing or always `false`.
**Why it happens:** The kid profile does not carry subscription data; it must be fetched from the parent User row via `kid.parentId`.
**How to avoid:** In the `home-summary` handler, always look up `prisma.user.findUnique({ where: { id: kid.parentId } })` inside the `Promise.all` to get subscription fields, regardless of whether the caller is a kid or parent JWT.

### Pitfall 4: Trial Re-Set on Existing Users
**What goes wrong:** The `register` endpoint uses `upsert`. If an existing user re-registers (e.g., on the `update` path after a Supabase account claim), `trialEndsAt` gets reset to 7 days from now.
**Why it happens:** The upsert's `update` block sets trial fields unconditionally.
**How to avoid:** Only set `trialEndsAt` and `subscriptionStatus` in the `create` block of the upsert. The `update` block must not touch subscription fields.

### Pitfall 5: Customer Portal Returns 404 When Not Configured
**What goes wrong:** `stripe.billingPortal.sessions.create()` throws a Stripe error because the Customer Portal is not enabled in the Stripe Dashboard.
**Why it happens:** The portal is disabled by default in Stripe and must be manually configured.
**How to avoid:** In the Stripe Dashboard, go to Settings > Billing > Customer portal and enable it before testing. Document this as a manual Wave 0 setup step.

### Pitfall 6: Lesson Module Slug Requires Join
**What goes wrong:** The progress route's lesson lookup (`prisma.lesson.findFirst({ where: { slug } })`) does not include the module, so `lesson.module.slug` is undefined and the free-module check throws.
**Why it happens:** The current progress route fetches a `Lesson` without the `module` relation.
**How to avoid:** Change the lesson lookup to `include: { module: true }` before checking `FREE_MODULE_SLUGS`.

### Pitfall 7: Stripe Checkout trial_period_days vs. Existing Trial
**What goes wrong:** A parent who signs up, uses 5 days of their 7-day trial, then subscribes gets a fresh 7-day Stripe trial on top of their DB trial, effectively getting 12+ days free.
**Why it happens:** `trial_period_days: 7` is always passed to the Checkout session.
**How to avoid:** When creating the Checkout session, compute days remaining in the DB trial (`Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86400000))`). Pass that computed value as `trial_period_days`. If the trial has already expired (status `none` or `canceled`), pass `trial_period_days: 0` or omit it.

---

## Code Examples

Verified patterns from Stripe documentation and existing project patterns:

### Prisma Migration — Add Subscription Fields to User
```prisma
// In schema.prisma — add to model User
stripeCustomerId     String?   @unique
stripeSubscriptionId String?   @unique
subscriptionStatus   String    @default("none") // none|trialing|active|canceled|past_due
subscriptionEnd      DateTime?
trialEndsAt          DateTime?
```

Run: `cd server && npx prisma migrate dev --name add_subscription_fields`

### Register Route — Trial Init (create path only)
```javascript
// In auth.js POST /register — upsert create block only
create: {
  supabaseAuthId: req.user.id,
  email,
  name: name || null,
  role: validRole,
  subscriptionStatus: 'trialing',
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
},
// update block: does NOT include subscriptionStatus or trialEndsAt
```

### home-summary — Add subscription to Promise.all
```javascript
const [modules, achievements, enrollments, dailyChallenge, parentUser] = await Promise.all([
  prisma.module.findMany({ ... }),
  prisma.achievement.findMany({ ... }),
  prisma.classroomStudent.findMany({ ... }),
  prisma.dailyChallenge.findUnique({ ... }),
  prisma.user.findUnique({ where: { id: kid.parentId }, select: {
    subscriptionStatus: true, trialEndsAt: true, subscriptionEnd: true
  }}),
]);

const isPremium = parentUser
  ? (parentUser.subscriptionStatus === 'active' ||
     (parentUser.subscriptionStatus === 'trialing' && parentUser.trialEndsAt > new Date()))
  : false;

res.json({
  kid: { ... },
  progress,
  achievements,
  classrooms: enrollments.map(e => e.classroom),
  dailyChallenge: { ... },
  isPremium,
  subscription: parentUser ? {
    status: parentUser.subscriptionStatus,
    trialEndsAt: parentUser.trialEndsAt,
    subscriptionEnd: parentUser.subscriptionEnd,
  } : null,
});
```

### index.js — Webhook Before JSON Middleware
```javascript
// BEFORE app.use(express.json())
app.post(
  '/api/billing/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/billing').webhookHandler
);

// existing
app.use(express.json());
// ... other routes
app.use('/api/billing', requireAuth, require('./routes/billing').router);
```

Note: `billing.js` exports both a `router` (for authenticated billing endpoints) and a standalone `webhookHandler` function (unauthenticated, raw body).

### KidHome — Locked ModuleCard
```jsx
// home-summary now returns isPremium
const FREE_MODULE_SLUGS = ['alphabet', 'numbers', 'shapes'];
const isLocked = !isPremium && !FREE_MODULE_SLUGS.includes(mod.moduleSlug);

// In ModuleCard render:
<div
  style={{
    ...cardStyle,
    opacity: isLocked ? 0.45 : 1,
    pointerEvents: isLocked ? 'none' : 'auto',
    position: 'relative',
  }}
>
  {isLocked && (
    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 20 }}>🔒</span>
  )}
  {/* existing card content */}
</div>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe.js in-app payment form | Stripe Checkout (hosted page) | Stripe ~2019 | No PCI scope for server; SCA/3DS handled automatically |
| Manual trial tracking via cron | Stripe `trial_period_days` + webhook events | Stripe ~2018 | Stripe manages trial end; webhook fires at the right time |
| Separate Subscription DB model | Fields on User (for single-subscription-per-user apps) | N/A — pattern choice | Simpler for Phase 4; Phase 5 school licensing may need its own model |

**Deprecated/outdated:**
- `stripe.charges.create()`: Use `stripe.checkout.sessions.create()` or `stripe.paymentIntents.create()`. Charges API is legacy.
- `stripe.customers.createPortalSession()`: Renamed to `stripe.billingPortal.sessions.create()` in SDK v9+. Current SDK (v20) uses the billing portal namespace.

---

## Open Questions

1. **Stripe Price IDs (STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL)**
   - What we know: These are created manually in the Stripe Dashboard under Products. The exact IDs are not known until the parent sets up the Stripe account.
   - What's unclear: Whether the Stripe account already has Products created, or if Wave 0 must include a "create Products in Stripe Dashboard" setup step.
   - Recommendation: Treat this as a Wave 0 manual setup step. Planner should include a task for "Create Monthly and Annual Products in Stripe Dashboard, copy Price IDs to Railway env vars."

2. **STRIPE_WEBHOOK_SECRET for Railway**
   - What we know: Stripe provides a webhook signing secret when you register the endpoint URL in the Stripe Dashboard. For local testing, `stripe listen` generates a local secret.
   - What's unclear: Whether the developer has a Stripe webhook endpoint already registered for the Railway server URL.
   - Recommendation: Wave 0 task to register `https://kids-edu-game-production.up.railway.app/api/billing/webhook` in Stripe Dashboard and copy the signing secret to Railway env vars.

3. **Customer Portal Configuration**
   - What we know: `stripe.billingPortal.sessions.create()` requires the portal to be enabled in Stripe Dashboard.
   - What's unclear: Current portal configuration state.
   - Recommendation: Wave 0 manual step — enable Customer Portal in Stripe Dashboard (Settings > Billing > Customer portal).

---

## Validation Architecture

> nyquist_validation is true in .planning/config.json — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed in server devDependencies) |
| Config file | None — Vitest uses defaults; test files in `server/tests/` |
| Quick run command | `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/monetization/` |
| Full suite command | `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run` |

### Phase Requirements — Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MON-01 | Progress write rejected for locked module when not premium | unit | `npx vitest run tests/monetization/mon01-module-gating.test.js` | Wave 0 |
| MON-01 | home-summary returns isPremium=false for expired trial | unit | `npx vitest run tests/monetization/mon01-module-gating.test.js` | Wave 0 |
| MON-02 | Checkout session created for valid monthly priceId | unit | `npx vitest run tests/monetization/mon02-checkout-session.test.js` | Wave 0 |
| MON-02 | Checkout session rejected for unknown priceId | unit | `npx vitest run tests/monetization/mon02-checkout-session.test.js` | Wave 0 |
| MON-03 | checkout.session.completed sets subscriptionStatus=active | unit | `npx vitest run tests/monetization/mon03-webhook-handler.test.js` | Wave 0 |
| MON-03 | customer.subscription.deleted sets subscriptionStatus=canceled | unit | `npx vitest run tests/monetization/mon03-webhook-handler.test.js` | Wave 0 |
| MON-03 | invoice.payment_failed sets subscriptionStatus=past_due | unit | `npx vitest run tests/monetization/mon03-webhook-handler.test.js` | Wave 0 |
| MON-03 | Webhook rejects invalid signature with 400 | unit | `npx vitest run tests/monetization/mon03-webhook-handler.test.js` | Wave 0 |
| MON-04 | Billing portal session returns URL for active subscriber | unit | `npx vitest run tests/monetization/mon04-portal.test.js` | Wave 0 |
| MON-04 | Billing portal rejects parent with no stripeCustomerId | unit | `npx vitest run tests/monetization/mon04-portal.test.js` | Wave 0 |
| MON-05 | ParentDashboard upgrade banner shown when not active | manual-only | — | N/A |
| MON-05 | ModuleCard lock overlay rendered when isPremium=false | manual-only | — | N/A |
| MON-06 | Register sets trialEndsAt and subscriptionStatus=trialing | unit | `npx vitest run tests/monetization/mon06-trial-init.test.js` | Wave 0 |
| MON-06 | Re-register (update path) does not reset trialEndsAt | unit | `npx vitest run tests/monetization/mon06-trial-init.test.js` | Wave 0 |

**Manual-only justification for MON-05 client tests:** The client has no Vitest setup and no test infrastructure. React component tests would require adding `@testing-library/react` and `jsdom` — out of scope for Phase 4. Visual paywall behavior is verified manually against success criteria #2 and #3.

### Sampling Rate
- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/monetization/`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/tests/monetization/mon01-module-gating.test.js` — covers MON-01
- [ ] `server/tests/monetization/mon02-checkout-session.test.js` — covers MON-02
- [ ] `server/tests/monetization/mon03-webhook-handler.test.js` — covers MON-03
- [ ] `server/tests/monetization/mon04-portal.test.js` — covers MON-04
- [ ] `server/tests/monetization/mon06-trial-init.test.js` — covers MON-06
- [ ] Manual Stripe Dashboard setup: create Products/Prices, enable Customer Portal, register webhook URL, copy secrets to Railway env vars

---

## Sources

### Primary (HIGH confidence)
- Stripe Node.js SDK npm registry — version 20.4.1 verified via `npm view stripe version` (2026-03-21)
- `/Users/Ja_Jang/Application/kids-edu-game/server/src/index.js` — confirmed `express.json()` placement and route mounting pattern
- `/Users/Ja_Jang/Application/kids-edu-game/server/src/routes/auth.js` — confirmed upsert create/update structure for trial init
- `/Users/Ja_Jang/Application/kids-edu-game/server/src/routes/kids.js` — confirmed home-summary Promise.all structure for adding parentUser query
- `/Users/Ja_Jang/Application/kids-edu-game/server/src/routes/progress.js` — confirmed lesson lookup needs `include: { module: true }` for free-module check
- `/Users/Ja_Jang/Application/kids-edu-game/server/prisma/schema.prisma` — confirmed User model has no subscription fields yet; migration required
- `/Users/Ja_Jang/Application/kids-edu-game/server/tests/security/sec01-price-validation.test.js` — confirmed test pattern: `vi.spyOn(global.prisma)`, ESM dynamic import, supertest

### Secondary (MEDIUM confidence)
- Stripe documentation — webhook raw body requirement and `constructEvent` API are long-standing stable patterns; no breaking changes in SDK v20

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Stripe SDK version verified from npm registry; all other dependencies already installed
- Architecture: HIGH — Integration points verified directly from source files; webhook raw-body requirement is official Stripe documentation
- Pitfalls: HIGH — Most pitfalls derived from direct code inspection (upsert update-path trial reset, lesson module join, duplicate customer) rather than inference

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (Stripe SDK is stable; project codebase is the primary source)
