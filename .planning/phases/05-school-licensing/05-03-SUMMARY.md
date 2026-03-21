---
phase: 05-school-licensing
plan: 03
subsystem: api
tags: [school, licensing, module-gating, prisma, vitest, progress, kids]

# Dependency graph
requires:
  - phase: 05-01
    provides: getKidSchoolLicense utility in schoolUtils.js

provides:
  - School license bypass in progress.js module gating (getKidSchoolLicense call)
  - home-summary isPremium: true for kids in licensed school classrooms
  - 5 SCH-04 tests covering all bypass scenarios in both endpoints

affects: [06-reporting, any phase that reads isPremium from home-summary]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "School license bypass: check getKidSchoolLicense only after isParentPremium fails — parent subscription short-circuits and avoids extra DB query"
    - "Augmented isPremium: let not const for reassignable boolean; single source of truth for client (boolean flag, unchanged response shape)"

key-files:
  created:
    - server/tests/school/sch04-module-unlock.test.js
  modified:
    - server/src/routes/progress.js
    - server/src/routes/kids.js
    - server/tests/monetization/mon01-module-gating.test.js

key-decisions:
  - "School license check placed inside !isParentPremium branch — premium parents never incur the extra DB query"
  - "sendUpgradeNudge fires only when BOTH parent non-premium AND no school license — avoids spamming school-enrolled parents"
  - "mon01 tests needed classroomStudent.findFirst mock (null) added to both describe beforeEach blocks — getKidSchoolLicense uses findFirst not findMany"

patterns-established:
  - "When adding new bypass logic to existing gating, mock the new Prisma call in ALL affected test files' beforeEach"

requirements-completed: [SCH-04]

# Metrics
duration: 4min
completed: 2026-03-21
---

# Phase 5 Plan 03: School License Module Unlock Summary

**School license bypass wired into progress.js module gating and kids.js home-summary: school-enrolled kids get 200 on locked modules and isPremium: true without touching parent subscription state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-21T06:55:02Z
- **Completed:** 2026-03-21T06:59:06Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `getKidSchoolLicense` import and bypass check in `progress.js` POST handler — school-enrolled kids pass the module gate when parent is non-premium
- Added `getKidSchoolLicense` import in `kids.js` and augmented `isPremium` in home-summary response — unchanged response shape, single boolean flag for client
- Wrote 5 SCH-04 tests: licensed school allows, unlicensed rejects, no enrollment rejects, premium parent short-circuits, home-summary isPremium
- Fixed mon01 tests (auto-fix Rule 1): added `classroomStudent.findFirst` mock returning null to both describe blocks so existing "returns isPremium: false" tests keep passing

## Task Commits

1. **Task 1: School license bypass in progress.js and kids.js** - `dd712b4` (feat)
2. **Task 2: SCH-04 module unlock tests + mon01 fix** - `8102c51` (test)

## Files Created/Modified

- `server/src/routes/progress.js` - Added getKidSchoolLicense import + bypass check inside !isParentPremium block
- `server/src/routes/kids.js` - Added getKidSchoolLicense import + isPremium augmentation in home-summary
- `server/tests/school/sch04-module-unlock.test.js` - Full 5-test SCH-04 coverage (replaced stub)
- `server/tests/monetization/mon01-module-gating.test.js` - Added classroomStudent.findFirst spy (null) to both describe beforeEach blocks

## Decisions Made

- School license check is placed inside `!isParentPremium(parent)` branch so premium parents never incur the extra `getKidSchoolLicense` DB query
- `sendUpgradeNudge` only fires when BOTH parent non-premium AND school license is null — avoids nudging school-enrolled parents to upgrade
- Response shape in home-summary is unchanged (`isPremium` boolean + `subscription` object); client never knows if premium comes from parent or school

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] mon01 tests broke because classroomStudent.findFirst was not mocked**
- **Found during:** Task 2 (full suite run after SCH-04 tests passed)
- **Issue:** After adding `getKidSchoolLicense` to kids.js, mon01's "returns isPremium: false" tests got 500 errors because `classroomStudent.findFirst` was never mocked in mon01's beforeEach; the unmocked call threw a Prisma validation error
- **Fix:** Added `vi.spyOn(prisma.classroomStudent, 'findFirst').mockResolvedValue(null)` to both describe blocks in mon01-module-gating.test.js
- **Files modified:** server/tests/monetization/mon01-module-gating.test.js
- **Verification:** Full test suite 89/89 pass after fix
- **Committed in:** `8102c51` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in existing test file caused by new code)
**Impact on plan:** Necessary correctness fix. No scope creep.

## Issues Encountered

None beyond the mon01 regression caught during full suite run and resolved inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SCH-04 complete: school license bypass operational in both progress gating and home-summary
- All 89 server tests green
- Client behavior unchanged — single `isPremium` boolean, no UI changes needed

---
*Phase: 05-school-licensing*
*Completed: 2026-03-21*
