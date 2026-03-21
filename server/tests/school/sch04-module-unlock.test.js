import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_sch04';
const TEST_KID_SECRET = 'sch04-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

const KID_ID = 'kid-sch04';
const PARENT_ID = 'parent-sch04';
const LESSON_ID = 'lesson-sch04-uuid';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  name: 'School Kid',
  avatarId: 'bear',
  totalStars: 5,
  currentStreak: 1,
  coins: 20,
  parentId: PARENT_ID,
};

// Non-premium parent (school license is the only unlock path)
const NON_PREMIUM_PARENT = {
  subscriptionStatus: 'none',
  trialEndsAt: null,
};

// Active premium parent
const PREMIUM_PARENT = {
  subscriptionStatus: 'active',
  trialEndsAt: null,
};

// Locked module lesson (colors is NOT in FREE_MODULE_SLUGS)
const LOCKED_LESSON = {
  id: LESSON_ID,
  slug: 'red',
  module: { slug: 'colors' },
};

// Mock progress record returned by $transaction
const MOCK_PROGRESS_RECORD = {
  id: 'progress-sch04-uuid',
  kidId: KID_ID,
  lessonId: LESSON_ID,
  viewed: true,
  starsEarned: 1,
};

// Build a classroomStudent enrollment chain for getKidSchoolLicense
function buildEnrollment(licenseStatus = 'active', licenseExpiry = null) {
  return {
    id: 'enrollment-sch04',
    kidId: KID_ID,
    classroomId: 'classroom-sch04',
    classroom: {
      id: 'classroom-sch04',
      name: 'Class A',
      teacher: {
        id: 'teacher-sch04',
        schoolMembership: {
          id: 'membership-sch04',
          school: {
            id: 'school-sch04',
            name: 'Greenwood Elementary',
            licenseStatus,
            licenseExpiry: licenseExpiry ?? null,
          },
        },
      },
    },
  };
}

// Modules mock for home-summary
const MOCK_MODULES = [
  {
    slug: 'alphabet', title: 'Alphabet', iconEmoji: '🔤', sortOrder: 1,
    lessons: [{ slug: 'a', sortOrder: 1, progress: [] }],
  },
];

describe('SCH-04: Kids in licensed school get all modules unlocked', () => {
  describe('Progress route — module gating', () => {
    let kidFindUnique, lessonFindFirst, userFindUnique, classroomStudentFindFirst, transactionSpy;

    beforeEach(() => {
      // resolveWriteAccess + streak lookup both use kidProfile.findUnique
      kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);

      // Default: locked module lesson (colors)
      lessonFindFirst = vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(LOCKED_LESSON);

      // Default: non-premium parent
      userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(NON_PREMIUM_PARENT);

      // Default: no classroom enrollment
      classroomStudentFindFirst = vi.spyOn(prisma.classroomStudent, 'findFirst').mockResolvedValue(null);

      // Mock transaction so upsertProgress doesn't hit DB
      transactionSpy = vi.spyOn(prisma, '$transaction').mockResolvedValue(MOCK_PROGRESS_RECORD);
    });

    afterEach(() => { vi.restoreAllMocks(); });

    it('kid in licensed school classroom can save progress on locked module', async () => {
      // Parent is not premium — school license is the bypass
      classroomStudentFindFirst.mockResolvedValue(buildEnrollment('active'));

      const res = await request
        .post(`/api/progress/${KID_ID}/lesson/red`)
        .set('Authorization', `Bearer ${kidToken}`)
        .send({ viewed: true });

      expect(res.status).toBe(200);
      // Verify upsertProgress was called (wrapped in $transaction)
      expect(transactionSpy).toHaveBeenCalled();
    });

    it('kid in unlicensed school classroom gets 403 on locked module', async () => {
      // School license is expired — should fall through to 403
      classroomStudentFindFirst.mockResolvedValue(buildEnrollment('expired'));

      const res = await request
        .post(`/api/progress/${KID_ID}/lesson/red`)
        .set('Authorization', `Bearer ${kidToken}`)
        .send({ viewed: true });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/premium/i);
    });

    it('kid with no school enrollment falls through to parent premium check and gets 403', async () => {
      // classroomStudentFindFirst returns null (default) — no enrollment
      // userFindUnique returns non-premium parent (default)

      const res = await request
        .post(`/api/progress/${KID_ID}/lesson/red`)
        .set('Authorization', `Bearer ${kidToken}`)
        .send({ viewed: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/premium/i);
    });

    it('kid in licensed school with premium parent gets 200 (parent check short-circuits before school check)', async () => {
      // Premium parent — school check should never be reached
      userFindUnique.mockResolvedValue(PREMIUM_PARENT);
      // Even if enrollment exists, it should not matter
      classroomStudentFindFirst.mockResolvedValue(buildEnrollment('active'));

      const res = await request
        .post(`/api/progress/${KID_ID}/lesson/red`)
        .set('Authorization', `Bearer ${kidToken}`)
        .send({ viewed: true });

      expect(res.status).toBe(200);
      // School check is inside the !isParentPremium branch, so findFirst is only called once
      // (for home-summary it is not called at all in the progress route if parent is premium)
    });
  });

  describe('home-summary endpoint — isPremium from school license', () => {
    let kidFindUnique, moduleFindMany, achievementFindMany, classroomStudentFindMany,
      classroomStudentFindFirst, dailyChallengeFindUnique, userFindUnique;

    beforeEach(() => {
      kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
      moduleFindMany = vi.spyOn(prisma.module, 'findMany').mockResolvedValue(MOCK_MODULES);
      achievementFindMany = vi.spyOn(prisma.achievement, 'findMany').mockResolvedValue([]);
      // home-summary uses findMany for enrollment display list
      classroomStudentFindMany = vi.spyOn(prisma.classroomStudent, 'findMany').mockResolvedValue([]);
      dailyChallengeFindUnique = vi.spyOn(prisma.dailyChallenge, 'findUnique').mockResolvedValue(null);
      // Default: non-premium parent
      userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(NON_PREMIUM_PARENT);
      // Default: licensed school enrollment (for getKidSchoolLicense — uses findFirst)
      classroomStudentFindFirst = vi.spyOn(prisma.classroomStudent, 'findFirst').mockResolvedValue(
        buildEnrollment('active')
      );
      vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([]);
    });

    afterEach(() => { vi.restoreAllMocks(); });

    it('home-summary returns isPremium: true for kid in licensed school with non-premium parent', async () => {
      const res = await request
        .get(`/api/kids/${KID_ID}/home-summary`)
        .set('Authorization', `Bearer ${kidToken}`)
        .expect(200);

      expect(res.body.isPremium).toBe(true);
      // Subscription shape still present and unchanged
      expect(res.body).toHaveProperty('subscription');
      expect(res.body.subscription.status).toBe('none');
    });
  });
});
