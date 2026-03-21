# Phase 5: School Licensing - Research

**Researched:** 2026-03-21
**Domain:** Stripe B2B seat licensing, Prisma schema extension, multi-role access control, school admin UI
**Confidence:** HIGH — all findings grounded in existing codebase patterns and Phase 4 implementation that is already shipping

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCH-01 | School entity added to DB with name, seat count, license expiry date, and Stripe customer ID | New `School` Prisma model; Stripe customer ID stored on school (not on User); migration adds School + SchoolTeacher join table |
| SCH-02 | School admin role can purchase a seat license via Stripe Checkout (annual pricing per seat or flat-rate tiers) | Reuses billing.js Checkout pattern; school admin variant posts `{ plan: 'school_tier_X', schoolId }` to new `/api/billing/school-checkout` route |
| SCH-03 | Teachers provisioned under a school; classrooms created by school teachers count against school seat allocation | SchoolTeacher join table; classroom creation checks remaining school seats before allowing; `isSchoolLicensed()` helper mirrors `isParentPremium()` |
| SCH-04 | Kids in school-licensed classrooms have all modules unlocked regardless of parent subscription status | Progress route gating adds school-license bypass: if kid is enrolled in any classroom owned by a licensed school, `isPremium = true` |
| SCH-05 | School admin dashboard shows seats used, renewal date, and downloadable invoice history | `GET /api/billing/school-invoices` returns Stripe invoice list; new SchoolDashboard page; seats-used from `SchoolTeacher` count |
| SCH-06 | Stripe webhook handler for school license events (purchase, renewal, expiry) | Add `school_checkout.session.completed`, `customer.subscription.deleted` (school variant), and `invoice.payment_failed` cases to existing `webhookHandler` |
</phase_requirements>

---

## Summary

Phase 5 extends KidsLearn from B2C (parent subscriptions) to B2B (school seat licensing). The codebase already has everything this phase builds on: Stripe 20.4.1 is installed, the webhook handler pattern is established, Prisma 7 migrations are working, and teacher/classroom models exist. The core work is three layers: (1) a new `School` Prisma model with a Stripe customer ID and license fields, (2) new billing routes for school checkout and invoices that mirror the existing parent billing routes, and (3) a school-license bypass in the content-gating logic so enrolled kids get all modules unlocked without touching parent subscription state.

The most architecturally important decision is **where school-license status lives and how it flows to kids**. A kid gets school-unlocked access through this chain: `SchoolTeacher` proves a teacher belongs to a licensed school → `Classroom.teacherId` links a classroom to that teacher → `ClassroomStudent.classroomId` links a kid to that classroom → progress route walks this chain to determine `isSchoolKid`. This lookup must be efficient: a single DB query joining ClassroomStudent → Classroom → SchoolTeacher → School is the correct shape, not four sequential round-trips.

The second critical concern is seat counting. "Seats" in this context are teachers, not kids — schools buy a license for N teachers (or a flat-rate unlimited plan), and each teacher can create unlimited classrooms. The classroom-creation route must enforce the seat cap before creating a new classroom's owning teacher slot.

**Primary recommendation:** Build in this order: Prisma migration (School + SchoolTeacher models) → `isSchoolLicensed()` utility → school checkout route + webhook cases → progress-route school bypass → home-summary school-license flag → SchoolDashboard UI.

---

## Standard Stack

### Core (all already installed — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.4.1 | Stripe API — Checkout, Invoices, webhooks | Already installed, Phase 4 pattern established |
| @prisma/client | 7.4.2 | ORM — new School model + relations | Already installed, migration workflow proven |
| prisma | 7.4.2 | Schema management + migrations | `npx prisma migrate deploy` pattern from Phase 4 |
| express | 5.2.1 | New `/api/billing/school-*` routes | Already the server framework |
| vitest | 3.2.4 | Unit tests for new routes | Established test pattern in tests/monetization/ |
| supertest | 7.2.2 | HTTP-level test assertions | Established in all Phase 4 tests |

### No New Dependencies

Phase 5 introduces zero new npm packages. Everything needed (Stripe SDK, Prisma, Express, Resend for any email, jwt for auth) is already installed. This is a significant risk reducer.

---

## Architecture Patterns

### New Prisma Models

```
// Add to schema.prisma

model School {
  id               String    @id @default(uuid())
  name             String
  contactEmail     String
  seatCount        Int       @default(10)    // licensed seats (teachers)
  licenseStatus    String    @default("none") // none | active | expired
  licenseExpiry    DateTime?
  stripeCustomerId String?   @unique
  stripeSubscriptionId String? @unique
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  teachers  SchoolTeacher[]
}

model SchoolTeacher {
  id        String   @id @default(uuid())
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  userId    String   @unique       // one teacher belongs to at most one school
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String   @default("teacher")  // teacher | admin
  addedAt   DateTime @default(now())

  @@unique([schoolId, userId])
}
```

The `User` model needs a back-relation added:
```
// In User model — add:
schoolMembership  SchoolTeacher?
```

### New File: `server/src/lib/schoolUtils.js`

Mirrors `subscriptionUtils.js`. Provides:

```javascript
// CJS module — use require() like all other lib files

function isSchoolLicensed(school) {
  if (!school) return false;
  if (school.licenseStatus !== 'active') return false;
  if (school.licenseExpiry && school.licenseExpiry < new Date()) return false;
  return true;
}

// Returns the school record if this kid is enrolled in any
// classroom owned by a teacher in a licensed school — null otherwise.
async function getKidSchoolLicense(prisma, kidId) {
  const enrollment = await prisma.classroomStudent.findFirst({
    where: { kidId },
    include: {
      classroom: {
        include: {
          teacher: {
            include: { schoolMembership: { include: { school: true } } },
          },
        },
      },
    },
  });
  if (!enrollment) return null;
  const school = enrollment.classroom.teacher.schoolMembership?.school;
  return isSchoolLicensed(school) ? school : null;
}

module.exports = { isSchoolLicensed, getKidSchoolLicense };
```

### New Route: `server/src/routes/schoolBilling.js`

Separate file from `billing.js` to keep B2C and B2B concerns isolated. Exports:
- `POST /api/billing/school-checkout` — creates Checkout for school admin
- `GET /api/billing/school-invoices` — lists Stripe invoices for school's Stripe customer
- `GET /api/billing/school-status` — returns school's current license state + seats used

The webhook handler in `billing.js` is extended (not duplicated) to handle school events by checking `session.metadata.schoolId` presence.

### Module Gating Change in `progress.js`

The existing guard at line 206 of `progress.js` is:

```javascript
// CURRENT (Phase 4):
if (lesson.module && !FREE_MODULE_SLUGS.includes(lesson.module.slug)) {
  const parent = await prisma.user.findUnique({ ... });
  if (!isParentPremium(parent)) { return 403; }
}
```

Phase 5 adds one additional check before the 403:

```javascript
// Phase 5 addition — check school license bypass
if (!isParentPremium(parent)) {
  const schoolLicense = await getKidSchoolLicense(prisma, kid.id);
  if (!schoolLicense) {
    sendUpgradeNudge(kid.parentId).catch(...);
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  // school license found — allow through
}
```

### home-summary Change in `kids.js`

`home-summary` endpoint currently returns `isPremium` from `isParentPremium(parentUser)`. Phase 5 augments this:

```javascript
// After existing isPremium calc:
let isPremium = isParentPremium(parentUser);
if (!isPremium) {
  const schoolLicense = await getKidSchoolLicense(prisma, kid.id);
  if (schoolLicense) isPremium = true;
}
```

The response shape is unchanged — `isPremium: true` means "all modules unlocked" regardless of whether that's from parent subscription or school license.

### Stripe Checkout for Schools

Schools use `mode: 'subscription'` (annual recurring) or `mode: 'payment'` (one-time annual). Recommendation: **use `mode: 'payment'`** for schools with an annual renewal cycle managed by webhook. This is simpler than subscription-mode for institutional buyers who may pay by invoice.

However, Stripe `mode: 'payment'` does not trigger renewal webhooks — you'd need to handle renewal manually. The safer approach that reuses existing webhook infrastructure is `mode: 'subscription'` with an annual price, identical to the parent subscription pattern. The webhook events (`checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`) are the same event types already handled.

**Use `mode: 'subscription'`** with a new Stripe Price ID for the school annual plan. Store `STRIPE_PRICE_SCHOOL_ANNUAL` in env vars.

### Stripe Invoice Download

```javascript
// GET /api/billing/school-invoices
const invoices = await stripe.invoices.list({
  customer: school.stripeCustomerId,
  limit: 24,
});
// Return: id, amount_paid, status, invoice_pdf (hosted URL), period_start, period_end
```

`invoice.invoice_pdf` is a Stripe-hosted URL (expires in ~1 hour). Return the URL per invoice; client opens it in a new tab. Do not proxy the PDF through the KidsLearn server.

### School Admin Dashboard UI

New page: `client/src/pages/SchoolDashboard.jsx`

Route: `/school` — accessible only to users with `role === 'school_admin'` OR a regular teacher who is the school's admin in `SchoolTeacher`.

Alternative: keep role-check in the `SchoolTeacher.role` field (`admin | teacher`) and check it server-side. The `User.role` field stays `teacher` — no new role value needed on User.

UI sections:
1. License status card (status, expiry, seats used / seats total)
2. Teachers list (provisioned teachers with email + classroom count)
3. Add teacher by email (POST `/api/school/teachers`)
4. Invoices table with download links

### Teacher Provisioning

Schools add teachers by email. The flow:
1. School admin enters a teacher's email address
2. Server checks if a User with that email exists:
   - If yes: creates `SchoolTeacher` row
   - If no: **do not pre-create a User** — send an invite email (via Resend) with a signup link; teacher signs up normally; registration route checks for pending invite
3. Seat cap enforced: `SchoolTeacher.count({ where: { schoolId } }) >= school.seatCount` → reject with 403

Simple approach for Phase 5: only allow adding teachers who already have a KidsLearn account. Defer invite-by-email to v2 (it adds complexity: pending invite table, signup flow changes).

### New Route File: `server/src/routes/school.js`

Handles school provisioning (separate from billing):
- `GET /api/school/me` — returns current school + seats used for school admin
- `GET /api/school/teachers` — list provisioned teachers
- `POST /api/school/teachers` — add teacher by userId or email (seat cap check)
- `DELETE /api/school/teachers/:userId` — remove teacher from school

### Recommended Project Structure Addition

```
server/src/
├── lib/
│   ├── subscriptionUtils.js   (existing — parent subscriptions)
│   └── schoolUtils.js         (new — school license checks)
├── routes/
│   ├── billing.js             (existing — extend webhook handler)
│   ├── schoolBilling.js       (new — school checkout + invoices)
│   └── school.js              (new — teacher provisioning)
client/src/pages/
│   └── SchoolDashboard.jsx    (new)
server/tests/school/
│   ├── sch01-school-model.test.js
│   ├── sch02-school-checkout.test.js
│   ├── sch03-seat-allocation.test.js
│   ├── sch04-module-unlock.test.js
│   ├── sch05-invoices.test.js
│   └── sch06-school-webhook.test.js
```

### Anti-Patterns to Avoid

- **Storing school license on User.role**: Do not add `school_admin` to `User.role`. School admin status lives in `SchoolTeacher.role`. `User.role` stays `parent | teacher` — this avoids auth middleware changes.
- **Blocking webhook with school lookup**: `webhookHandler` must not make multiple DB round-trips in series. Identify school events by `session.metadata.schoolId` presence and handle synchronously with a single `school.update()`.
- **Reusing `User.stripeCustomerId` for schools**: Schools are a separate billing entity from parents. School Stripe customer IDs belong on `School.stripeCustomerId`, never on `User`.
- **Per-kid seat counting**: Seats count teachers, not kids. Counting enrolled kids would make seat management unworkable for a school of 300 students.
- **Separate `isPremiumSchool` flag in home-summary**: The client must not need to distinguish parent-premium from school-premium. Return a single `isPremium: boolean` — the server resolves the source.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Invoice PDFs | Custom PDF generation | `invoice.invoice_pdf` from Stripe invoices API | Stripe generates compliant invoices with school/company details |
| Seat enforcement | Custom quota system | DB count query on `SchoolTeacher` before insert | Simple, transactionally safe, no Redis/queue needed |
| Teacher invite emails | Custom invite flow | Resend (already installed) + Phase 5 simple path (existing-user-only) | Defer full invite flow to v2 |
| Stripe subscription renewal | Manual date-check cron | Stripe `customer.subscription.deleted` + `invoice.payment_failed` webhooks | Already handled in billing.js pattern; just add school variant |

---

## Common Pitfalls

### Pitfall 1: School License Lookup N+1 in Progress Route

**What goes wrong:** `getKidSchoolLicense()` is called on every `POST /api/progress/:kidId/lesson/:lessonSlug`. If it makes multiple sequential queries (kid → classrooms → teacher → schoolMembership → school), a lesson save triggers 4–5 DB round-trips just for the license check.
**Why it happens:** Naive implementation follows Prisma relations one hop at a time.
**How to avoid:** Single `prisma.classroomStudent.findFirst()` with a deep nested `include` chain (as shown in the schoolUtils.js example above) returns all data in one query.
**Warning signs:** Slow lesson saves, DB query count spikes in Railway logs.

### Pitfall 2: Webhook Routing Collision with Parent Events

**What goes wrong:** `checkout.session.completed` handler updates `User` table. When a school admin checks out, `session.metadata.userId` is absent but `session.metadata.schoolId` is present. If the handler blindly tries `prisma.user.update({ where: { id: undefined } })`, Prisma throws.
**Why it happens:** Extending the existing switch-case without a guard on metadata presence.
**How to avoid:** Check `if (session.metadata?.schoolId)` first; route to school handler. Otherwise route to parent handler. Never let undefined reach a `where` clause.
**Warning signs:** Stripe webhook delivery failures with 500 responses, Stripe Dashboard shows failed webhook attempts.

### Pitfall 3: Classroom Seat Cap Race Condition

**What goes wrong:** Two school admins simultaneously add the 10th and 11th teacher to a 10-seat license — both read count=9, both succeed.
**Why it happens:** Check-then-insert without a transaction.
**How to avoid:** Wrap seat check + SchoolTeacher.create in a Prisma `$transaction`. The count inside the transaction sees the committed state.
**Warning signs:** School has more `SchoolTeacher` rows than `seatCount`.

### Pitfall 4: License Expiry Not Checked at Request Time

**What goes wrong:** School license expires but webhook fails to fire (Stripe delivery failure). Kids remain unlocked indefinitely.
**Why it happens:** Relying solely on webhook to update `licenseStatus = 'expired'`.
**How to avoid:** `isSchoolLicensed()` checks BOTH `licenseStatus === 'active'` AND `licenseExpiry > new Date()`. Even if the webhook fails, the date check revokes access at the correct time.
**Warning signs:** Kids with access beyond `licenseExpiry` date.

### Pitfall 5: Stripe Price ID for Schools Not Set in Env

**What goes wrong:** `STRIPE_PRICE_SCHOOL_ANNUAL` env var missing in Railway/production. School checkout silently falls back to `undefined` price ID, causing Stripe API error.
**Why it happens:** Same startup gap as `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` — they were already present so it's easy to forget the school variant.
**How to avoid:** Add `STRIPE_PRICE_SCHOOL_ANNUAL` check to the existing startup validation or to the school checkout handler with an explicit 500 + log if missing.

---

## Code Examples

### Prisma Migration File Pattern (mirrors Phase 4)

```sql
-- Migration: 20260321_add_school_licensing.sql
CREATE TABLE "School" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "seatCount" INTEGER NOT NULL DEFAULT 10,
  "licenseStatus" TEXT NOT NULL DEFAULT 'none',
  "licenseExpiry" TIMESTAMP(3),
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "School_stripeCustomerId_key" ON "School"("stripeCustomerId");

CREATE TABLE "SchoolTeacher" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'teacher',
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchoolTeacher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolTeacher_userId_key" ON "SchoolTeacher"("userId");
CREATE UNIQUE INDEX "SchoolTeacher_schoolId_userId_key" ON "SchoolTeacher"("schoolId", "userId");
```

Generated by `npx prisma migrate dev --name add_school_licensing` (dev) or `npx prisma migrate deploy` (CI/Railway).

### Webhook Handler Extension Pattern

```javascript
// In billing.js webhookHandler — extend the switch statement:
case 'checkout.session.completed': {
  const session = event.data.object;
  if (session.metadata?.schoolId) {
    // School checkout
    await prisma.school.update({
      where: { id: session.metadata.schoolId },
      data: {
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        licenseStatus: 'active',
        // licenseExpiry set by customer.subscription.updated event
      },
    });
  } else if (session.metadata?.userId) {
    // Existing parent checkout handler...
    await prisma.user.update({ where: { id: session.metadata.userId }, data: { ... } });
  }
  break;
}
case 'customer.subscription.deleted': {
  const sub = event.data.object;
  // Try school first
  const school = await prisma.school.findFirst({ where: { stripeSubscriptionId: sub.id } });
  if (school) {
    await prisma.school.update({
      where: { id: school.id },
      data: { licenseStatus: 'expired', licenseExpiry: new Date() },
    });
  } else {
    // Existing parent cancellation handler...
    await prisma.user.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { ... } });
  }
  break;
}
```

### Test Pattern for School Routes (mirrors Phase 4 billing tests)

```javascript
// tests/school/sch02-school-checkout.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createRequire } from 'module';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PRICE_SCHOOL_ANNUAL = 'price_school_annual_test';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_KEY = '';

const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;
const require = createRequire(import.meta.url);
const billing = require('../../src/routes/schoolBilling.js');
const stripe = billing.stripe;
// ... spyOn pattern identical to mon02-checkout-session.test.js
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate Stripe SDK per file | Single `stripe` instance exported from billing.js, imported via `createRequire` in tests | Phase 4 decision | ESM/CJS boundary — must use same pattern for schoolBilling.js |
| vi.mock() for CJS modules | vi.spyOn(global.prisma) | Phase 1 decision | All school tests must spy on global.prisma, not mock() |
| Separate subscription model | Fields on User table | Phase 4 decision | School gets its own School model since it's a separate entity — fine |
| migrate dev in CI | migrate deploy in non-interactive envs | Phase 4 decision | Use `prisma migrate deploy` in Railway deploy step |

---

## Open Questions

1. **School admin signup flow**
   - What we know: Schools need an admin account to purchase the license. Teachers can already sign up as `role: 'teacher'`.
   - What's unclear: Does the "school admin" sign up via the normal teacher flow and then separately create/purchase a school license? Or is there a separate onboarding page?
   - Recommendation: Keep it simple for Phase 5 — any teacher can create a school (POST `/api/school` with a name), making themselves the admin. No separate admin role needed. Implement as a "Create School" button in TeacherDashboard.

2. **Seat pricing tiers vs per-seat**
   - What we know: Requirements say "annual pricing per seat or flat-rate tiers." Both are valid Stripe patterns.
   - What's unclear: Which is implemented? Per-seat requires Stripe quantity at checkout; flat-rate tiers use different Price IDs.
   - Recommendation: Use **flat-rate tiers** for Phase 5 (e.g., Tier 1: up to 5 teachers, Tier 2: up to 15 teachers, Tier 3: up to 50 teachers). Simpler Checkout session — no quantity input. Add 3 env vars: `STRIPE_PRICE_SCHOOL_TIER_1/2/3`. Per-seat billing can be added in v2.

3. **What happens to kids' access when a teacher is removed from the school?**
   - What we know: Removing a `SchoolTeacher` row breaks the chain `kid → classroom → teacher → school`.
   - What's unclear: Should the classrooms owned by that teacher be dissolved? Or transferred? Or frozen?
   - Recommendation: For Phase 5, removing a teacher from a school does not affect existing classrooms or student enrollments. The classrooms remain, kids keep access until the school license itself expires. Document this as known behavior.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `server/vitest.config.js` |
| Quick run command | `cd server && npx vitest run tests/school/` |
| Full suite command | `cd server && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCH-01 | School + SchoolTeacher models exist and can be created | unit | `npx vitest run tests/school/sch01-school-model.test.js -x` | ❌ Wave 0 |
| SCH-02 | School checkout session creates valid Stripe Checkout URL | unit | `npx vitest run tests/school/sch02-school-checkout.test.js -x` | ❌ Wave 0 |
| SCH-03 | Classroom creation blocked when school is at seat cap | unit | `npx vitest run tests/school/sch03-seat-allocation.test.js -x` | ❌ Wave 0 |
| SCH-04 | Kid in licensed school classroom can save progress on locked module | unit | `npx vitest run tests/school/sch04-module-unlock.test.js -x` | ❌ Wave 0 |
| SCH-05 | School invoices endpoint returns Stripe invoice list with pdf URLs | unit | `npx vitest run tests/school/sch05-invoices.test.js -x` | ❌ Wave 0 |
| SCH-06 | Webhook: school checkout.session.completed sets licenseStatus=active; subscription.deleted sets expired | unit | `npx vitest run tests/school/sch06-school-webhook.test.js -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run tests/school/`
- **Per wave merge:** `cd /Users/Ja_Jang/Application/kids-edu-game/server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/school/sch01-school-model.test.js` — covers SCH-01
- [ ] `server/tests/school/sch02-school-checkout.test.js` — covers SCH-02
- [ ] `server/tests/school/sch03-seat-allocation.test.js` — covers SCH-03
- [ ] `server/tests/school/sch04-module-unlock.test.js` — covers SCH-04
- [ ] `server/tests/school/sch05-invoices.test.js` — covers SCH-05
- [ ] `server/tests/school/sch06-school-webhook.test.js` — covers SCH-06

All 6 test files must be created in Wave 0 (Plan 1) before implementation waves run. The global.prisma + createRequire + vi.spyOn pattern from `tests/helpers/setup.js` and `tests/monetization/mon02-checkout-session.test.js` applies directly.

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `server/src/routes/billing.js`, `progress.js`, `classrooms.js`, `lib/subscriptionUtils.js` — direct source of established patterns
- `server/tests/monetization/mon02-checkout-session.test.js` — authoritative test pattern for billing route tests
- `server/prisma/schema.prisma` — current schema; School model design extends directly from existing Classroom pattern
- `server/tests/helpers/setup.js` — authoritative vi.spyOn(global.prisma) test strategy
- `.planning/STATE.md` Accumulated Context — decisions section documents all binding prior choices

### Secondary (MEDIUM confidence)

- Stripe SDK 20.4.1 `stripe.invoices.list()` — standard API, verified usage against SDK installed in node_modules
- Stripe `invoice_pdf` field — present on Stripe Invoice objects in v20 SDK; standard for B2B invoice download flows

### Tertiary (LOW confidence)

- None — all claims are grounded in existing codebase code or Stripe SDK already installed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages, all verified from package.json and node_modules
- Architecture: HIGH — School model design follows exact patterns from User (subscription fields) and Classroom (teacher relations); license bypass follows exact pattern from isParentPremium
- Pitfalls: HIGH — all 5 pitfalls derived from real code paths in progress.js, billing.js, and classrooms.js; not speculative

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (Stripe SDK and Prisma are stable; no fast-moving dependencies introduced)
