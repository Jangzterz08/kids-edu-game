---
phase: 05-school-licensing
plan: "01"
subsystem: data-layer
tags: [prisma, school-licensing, migrations, test-helpers]
dependency_graph:
  requires: []
  provides: [School-model, SchoolTeacher-model, schoolUtils, test-helpers-school]
  affects: [server/prisma/schema.prisma, server/src/lib/schoolUtils.js, server/tests/helpers/setup.js]
tech_stack:
  added: []
  patterns: [CJS-module-pattern, vi.spyOn-beforeEach-pattern, single-query-deep-include]
key_files:
  created:
    - server/prisma/migrations/20260321063000_add_school_licensing/migration.sql
    - server/src/lib/schoolUtils.js
    - server/tests/school/sch01-school-model.test.js
    - server/tests/school/sch04-module-unlock.test.js
  modified:
    - server/prisma/schema.prisma
    - server/tests/helpers/setup.js
decisions:
  - "Use vi.spyOn in beforeEach (not at module top-level) for classroomStudent spy — vi.restoreAllMocks() in afterEach destroys module-level spy references"
  - "schoolUtils.js uses require('./db') (CJS, matches subscriptionUtils.js pattern) not ESM import"
  - "getKidSchoolLicense walks kid->classroomStudent->classroom->teacher->schoolMembership->school in a single prisma.classroomStudent.findFirst with deep nested include to avoid N+1"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_changed: 6
---

# Phase 05 Plan 01: School + SchoolTeacher Prisma Models and schoolUtils Summary

Data layer foundation for school licensing: School and SchoolTeacher Prisma models migrated to Supabase, isSchoolLicensed pure function and getKidSchoolLicense single-query chain walk in schoolUtils.js, test helpers extended for school models, SCH-01 test passing with 10 cases.

## What Was Built

### Task 1: Prisma Migration — School + SchoolTeacher Models

Added two new models to `server/prisma/schema.prisma`:

- `School` model: id, name, contactEmail, seatCount (default 10), licenseStatus (none|active|expired), licenseExpiry, stripeCustomerId (@unique), stripeSubscriptionId (@unique), createdAt, updatedAt, teachers relation
- `SchoolTeacher` model: id, schoolId, userId (@unique — one teacher per school), role (teacher|admin), addedAt, @@unique([schoolId, userId])
- `schoolMembership SchoolTeacher?` back-relation added to User model

Migration applied to Supabase: `20260321063000_add_school_licensing`. Schema validated with `npx prisma validate`.

### Task 2: schoolUtils.js + Test Helpers + Tests

Created `server/src/lib/schoolUtils.js` (CJS, mirrors subscriptionUtils.js):
- `isSchoolLicensed(school)` — pure function, checks both licenseStatus === 'active' AND licenseExpiry < new Date() (defense-in-depth against missed webhooks)
- `getKidSchoolLicense(kidId)` — single prisma.classroomStudent.findFirst with deep nested include chain, returns School or null

Extended `server/tests/helpers/setup.js` spyOnPrisma():
- Added school, schoolTeacher, classroomStudent spy objects
- Added update/updateMany to user spy object

Created `server/tests/school/sch01-school-model.test.js` — 10 tests, all passing:
- 6 isSchoolLicensed cases (null, none, expired, active no expiry, active future expiry, active past expiry)
- 4 getKidSchoolLicense cases (no enrollment, no school membership, inactive school, active school)

Created `server/tests/school/sch04-module-unlock.test.js` — stub with 3 todo tests for Plan 03.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.spyOn in beforeEach instead of module top-level**
- **Found during:** Task 2 — first test run showed "prisma.classroomStudent.findFirst is not a function"
- **Issue:** Plan's test pattern called spyOnPrisma() at module top level then vi.restoreAllMocks() in beforeEach. restoreAllMocks() destroys the spy reference making subsequent .mockResolvedValue() calls fail because the original function doesn't have that method.
- **Fix:** Changed to call vi.spyOn(prisma.classroomStudent, 'findFirst') inside beforeEach and vi.restoreAllMocks() inside afterEach — matching the existing mon01-module-gating.test.js pattern used throughout the codebase.
- **Files modified:** server/tests/school/sch01-school-model.test.js
- **Commit:** a271e9f

## Verification Results

- `npx prisma validate` exits 0
- `npx vitest run tests/school/sch01-school-model.test.js` — 10 tests passed
- `npx vitest run` — 62 passed, 3 todo, 1 skipped (full suite green)

## Self-Check: PASSED

- [x] server/prisma/migrations/20260321063000_add_school_licensing/migration.sql — FOUND
- [x] server/src/lib/schoolUtils.js — FOUND
- [x] server/tests/school/sch01-school-model.test.js — FOUND
- [x] server/tests/school/sch04-module-unlock.test.js — FOUND
- [x] server/prisma/schema.prisma contains `model School {` — CONFIRMED
- [x] server/prisma/schema.prisma contains `model SchoolTeacher {` — CONFIRMED
- [x] server/prisma/schema.prisma User model contains `schoolMembership SchoolTeacher?` — CONFIRMED
- [x] Commit 9859e61 (Task 1) — FOUND
- [x] Commit a271e9f (Task 2) — FOUND
