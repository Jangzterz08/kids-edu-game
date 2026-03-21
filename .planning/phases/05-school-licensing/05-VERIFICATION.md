---
phase: 05-school-licensing
verified: 2026-03-21T08:00:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to /school as a teacher account with school admin role"
    expected: "SchoolDashboard renders with license status card, seats used/total, upgrade buttons, empty teachers list, empty invoices section"
    why_human: "Visual layout and ocean theme styling cannot be verified programmatically; build succeeds but rendering requires browser"
  - test: "Navigate to /school as a non-admin teacher"
    expected: "Page renders with error message 'You are not a school admin' (403 from API causes error state)"
    why_human: "Error state conditional rendering requires browser with real auth context"
  - test: "Stripe checkout redirect — click 'Upgrade' tier button"
    expected: "POST /api/billing/school-checkout fires, window.location.href redirects to Stripe Checkout URL"
    why_human: "Requires live Stripe test keys (STRIPE_PRICE_SCHOOL_TIER_1/2/3 env vars) and browser redirect behavior"
---

# Phase 5: School Licensing Verification Report

**Phase Goal:** Deliver school/district licensing — multi-seat purchases, teacher provisioning, school license bypass for module gating, and a SchoolDashboard UI.
**Verified:** 2026-03-21T08:00:00Z
**Status:** human_needed (all automated checks pass; 3 visual/integration items need browser verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                   | Status     | Evidence                                                                                       |
|----|---------------------------------------------------------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------|
| 1  | School and SchoolTeacher tables exist in DB with correct columns and constraints                        | VERIFIED   | schema.prisma has both models with all required fields; migration 20260321063000 present       |
| 2  | isSchoolLicensed() returns true only for active, non-expired licenses                                   | VERIFIED   | schoolUtils.js: checks licenseStatus === 'active' AND licenseExpiry < new Date(); 10 tests passing |
| 3  | getKidSchoolLicense() walks the chain kid->classroomStudent->classroom->teacher->schoolMembership->school | VERIFIED   | Single prisma.classroomStudent.findFirst with deep nested include; tested with mocks           |
| 4  | A school admin can create a Stripe Checkout session for a school seat license                           | VERIFIED   | schoolBilling.js POST /school-checkout; metadata.schoolId set; sch02 tests pass (3 cases)     |
| 5  | Teachers can be added until seat cap, then rejected                                                     | VERIFIED   | school.js POST /teachers uses prisma.$transaction + count; SEAT_CAP_REACHED error; sch03 tests pass |
| 6  | Stripe webhook events for school checkout and cancellation update the School record                     | VERIFIED   | billing.js checks session.metadata?.schoolId first; school.findFirst for deletion/payment_failed; sch06 tests pass (5 cases) |
| 7  | School invoices retrievable via Stripe customer ID                                                      | VERIFIED   | schoolBilling.js GET /school-invoices calls stripe.invoices.list; sch05 tests pass            |
| 8  | Kid in licensed school classroom can save progress on any module including locked ones                  | VERIFIED   | progress.js calls getKidSchoolLicense(kid.id) inside !isParentPremium block; sch04 tests pass  |
| 9  | Kid in unlicensed school gets 403 on locked modules if parent is not premium                            | VERIFIED   | Both conditions (null school or expired license) fall through to 403; tested in sch04         |
| 10 | home-summary returns isPremium: true for kids in licensed schools                                       | VERIFIED   | kids.js augments isPremium with getKidSchoolLicense; sch04 test case #5 verifies this         |
| 11 | SchoolDashboard shows license status, seats, teachers, invoices                                         | VERIFIED   | SchoolDashboard.jsx (666 lines) has all 4 sections; fetches 3 endpoints in parallel            |
| 12 | /school route accessible only to teachers                                                               | VERIFIED   | App.jsx: /school route inside ProtectedRoute requireRole="teacher" + TeacherLayout block       |

**Score:** 12/12 truths verified (automated)

---

## Required Artifacts

| Artifact                                           | Provides                                         | Status     | Details                                                        |
|----------------------------------------------------|--------------------------------------------------|------------|----------------------------------------------------------------|
| `server/prisma/schema.prisma`                      | School and SchoolTeacher models with relations   | VERIFIED   | Both models present with all fields and constraints            |
| `server/prisma/migrations/20260321063000_*/migration.sql` | DB migration for school licensing          | VERIFIED   | Directory present in migrations/                               |
| `server/src/lib/schoolUtils.js`                    | isSchoolLicensed and getKidSchoolLicense         | VERIFIED   | CJS module, exports both functions, 44 lines substantive       |
| `server/src/routes/schoolBilling.js`               | School checkout, invoices, status endpoints      | VERIFIED   | 131 lines; exports router and stripe; all 3 endpoints present  |
| `server/src/routes/school.js`                      | School CRUD and teacher provisioning             | VERIFIED   | 191 lines; POST /, GET /me, GET /teachers, POST /teachers, DELETE /teachers/:userId |
| `server/src/routes/billing.js`                     | Extended webhook handler for school events       | VERIFIED   | school.update calls on lines 101, 124, 148; schoolId metadata check on line 92 |
| `server/src/routes/progress.js`                    | School license bypass in module gating           | VERIFIED   | getKidSchoolLicense imported (line 7) and called (line 214)    |
| `server/src/routes/kids.js`                        | home-summary augmented with school license check | VERIFIED   | getKidSchoolLicense imported (line 6) and called (line 150)    |
| `client/src/pages/SchoolDashboard.jsx`             | School admin dashboard UI                        | VERIFIED   | 666 lines; fetches school-status, school/teachers, school-invoices |
| `client/src/App.jsx`                               | Route for /school pointing to SchoolDashboard    | VERIFIED   | Lazy import (line 24); Route at line 62 inside teacher ProtectedRoute |
| `server/tests/school/sch01-school-model.test.js`   | Tests for School model and schoolUtils           | VERIFIED   | 92 lines; 10 test cases; all passing                           |
| `server/tests/school/sch02-school-checkout.test.js`| Tests for school checkout session creation       | VERIFIED   | 148 lines; 3+ test cases; passing                              |
| `server/tests/school/sch03-seat-allocation.test.js`| Tests for teacher provisioning and seat cap      | VERIFIED   | 182 lines; 4+ test cases; passing                              |
| `server/tests/school/sch04-module-unlock.test.js`  | Tests for school license module bypass           | VERIFIED   | 207 lines; 5 test cases; passing                               |
| `server/tests/school/sch05-invoices.test.js`       | Tests for invoice listing                        | VERIFIED   | 148 lines; 2+ test cases; passing                              |
| `server/tests/school/sch06-school-webhook.test.js` | Tests for school webhook event handling          | VERIFIED   | 271 lines; 5+ test cases; passing                              |

---

## Key Link Verification

| From                              | To                                        | Via                                          | Status  | Details                                                     |
|-----------------------------------|-------------------------------------------|----------------------------------------------|---------|-------------------------------------------------------------|
| `schoolUtils.js`                  | `schema.prisma` (ClassroomStudent model)  | prisma.classroomStudent.findFirst deep include | WIRED  | Line 22: findFirst with nested classroom.teacher.schoolMembership.school |
| `schoolBilling.js`                | `stripe.checkout.sessions.create`         | Stripe SDK call with metadata.schoolId        | WIRED  | Line 56: metadata: { schoolId: school.id, seatCount: ... }  |
| `school.js`                       | `prisma.schoolTeacher`                    | seat count check + create in $transaction     | WIRED  | Lines 143-151: prisma.$transaction with tx.schoolTeacher.count |
| `billing.js`                      | `prisma.school.update`                    | webhook handler school branch                 | WIRED  | Lines 101, 124, 148: school.update in all three event types |
| `progress.js`                     | `schoolUtils.js`                          | getKidSchoolLicense(kid.id) in module gate    | WIRED  | Import line 7; called line 214 inside !isParentPremium block |
| `kids.js`                         | `schoolUtils.js`                          | getKidSchoolLicense(kid.id) in home-summary   | WIRED  | Import line 6; called line 150, result sets isPremium       |
| `SchoolDashboard.jsx`             | `/api/billing/school-status`              | fetch in useEffect Promise.all                | WIRED  | Line 80: api.get('/api/billing/school-status')              |
| `SchoolDashboard.jsx`             | `/api/school/teachers`                    | fetch for teacher list                        | WIRED  | Line 81: api.get('/api/school/teachers')                    |
| `SchoolDashboard.jsx`             | `/api/billing/school-invoices`            | fetch for invoice list                        | WIRED  | Line 82: api.get('/api/billing/school-invoices')            |
| `SchoolDashboard.jsx`             | `/api/billing/school-checkout`            | POST on upgrade button click                  | WIRED  | Line 103: api.post('/api/billing/school-checkout', { plan }) |
| `App.jsx`                         | `SchoolDashboard.jsx`                     | React.lazy import + Route /school             | WIRED  | Lazy import line 24; Route line 62 inside teacher ProtectedRoute |
| `server/src/index.js`             | `schoolBilling.js` + `school.js`          | app.use mounts with requireAuth               | WIRED  | Lines 62-63: both routes mounted under /api/billing and /api/school |

---

## Requirements Coverage

| Requirement | Source Plan | Description                                                                         | Status    | Evidence                                                                        |
|-------------|-------------|--------------------------------------------------------------------------------------|-----------|---------------------------------------------------------------------------------|
| SCH-01      | 05-01-PLAN  | School entity in DB with name, seat count, license expiry, Stripe customer ID        | SATISFIED | schema.prisma School model has all listed fields; migration applied              |
| SCH-02      | 05-02-PLAN  | School admin can purchase seat license via Stripe Checkout (tier-based)              | SATISFIED | schoolBilling.js POST /school-checkout; sch02 tests: 3 cases covering valid/invalid plan/non-admin |
| SCH-03      | 05-02-PLAN  | Teachers provisioned under school; seat allocation enforced                          | SATISFIED | school.js POST /teachers with $transaction seat cap; sch03 tests: 4 cases covering add success/cap/non-teacher/already-in-school |
| SCH-04      | 05-03-PLAN  | Kids in school-licensed classrooms have all modules unlocked                         | SATISFIED | progress.js bypass + kids.js home-summary; sch04 tests: 5 cases covering all bypass scenarios |
| SCH-05      | 05-04-PLAN  | School admin dashboard shows seats used, renewal date, downloadable invoice history  | SATISFIED | SchoolDashboard.jsx 666 lines with all 4 sections; build succeeds; human visual check pending |
| SCH-06      | 05-02-PLAN  | Stripe webhook handler for school license events (purchase, renewal, expiry)         | SATISFIED | billing.js extended; sch06 tests: 5 cases covering all event types, parent behavior preserved |

All 6 requirement IDs from REQUIREMENTS.md Phase 5 mapping are claimed by plans and evidenced in code.

---

## Anti-Patterns Found

None. Scanned all phase-created/modified files:
- No TODO/FIXME/PLACEHOLDER comments
- No empty implementations (return null, return {}, return [])
- No stub handlers (console.log only)
- schoolBilling.js and school.js are fully implemented
- SchoolDashboard.jsx renders actual data (not placeholder text)

---

## Human Verification Required

### 1. SchoolDashboard Visual Layout

**Test:** Log in as a teacher who is a school admin (has SchoolTeacher.role = 'admin'). Navigate to http://localhost:5173/school.
**Expected:** Page renders with 4 sections: License Status card (school name, status badge, seats used/total, upgrade buttons or renewal date), Teachers list (with Remove buttons for non-admin teachers), Add Teacher form (email input + button), Invoices table (empty state shows "No invoices yet"). Ocean theme CSS variables applied correctly.
**Why human:** Vite build succeeds (exit 0) confirming no compile errors, but visual rendering, CSS variable resolution, and layout correctness require a browser.

### 2. Non-Admin Teacher Access

**Test:** Log in as a teacher without school admin membership. Navigate to http://localhost:5173/school.
**Expected:** Page shows "You are not a school admin." error message (API returns 403, component catches it and renders errorBox).
**Why human:** Error state conditional rendering requires real auth context and 403 response from the actual API.

### 3. Stripe Checkout Redirect (Upgrade Flow)

**Test:** As school admin with Stripe tier env vars configured, click "Upgrade" button for any tier on the license status card.
**Expected:** POST /api/billing/school-checkout fires, Stripe returns a session URL, window.location.href redirects to Stripe Checkout page. After completing checkout, Stripe webhook fires checkout.session.completed with schoolId metadata, School record updated with licenseStatus: 'active'.
**Why human:** Requires live Stripe test keys (STRIPE_PRICE_SCHOOL_TIER_1/2/3 not set in dev env), real webhook delivery (or Stripe CLI forwarding), and browser redirect behavior.

---

## Test Suite Results

- School tests (6 files): 37/37 passing
- Full server suite (22 files): 89/89 passing
- Client build: success (exit 0, 1.05s)
- Migration 20260321063000_add_school_licensing: applied

---

## Summary

Phase 5 goal is achieved. All 6 SCH requirements are implemented with substantive, wired code and passing automated tests. The data layer (School/SchoolTeacher models), billing API (checkout sessions, webhook extension, invoices), server-side license bypass (progress.js module gate, home-summary), and client UI (SchoolDashboard at /school) are all present and connected. No stubs, no orphaned artifacts, no anti-patterns.

Three items require human verification: visual rendering of the dashboard in a browser, non-admin error state display, and Stripe end-to-end checkout with live test keys.

---

_Verified: 2026-03-21T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
