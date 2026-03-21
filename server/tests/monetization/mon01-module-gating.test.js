import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'mon01-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

const KID_ID = 'kid-mon01';
const PARENT_ID = 'parent-mon01';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  name: 'Test Kid',
  avatarId: 'bear',
  totalStars: 10,
  currentStreak: 1,
  coins: 50,
  parentId: PARENT_ID,
};

const MOCK_MODULES = [
  {
    slug: 'alphabet', title: 'Alphabet', iconEmoji: '🔤', sortOrder: 1,
    lessons: [{ slug: 'a', sortOrder: 1, progress: [] }],
  },
];

function buildParentUser(subscriptionStatus, trialEndsAt = null, subscriptionEnd = null) {
  return {
    subscriptionStatus,
    trialEndsAt,
    subscriptionEnd,
  };
}

describe('MON-01: home-summary isPremium derivation', () => {
  let kidFindUnique, userFindUnique, moduleFindMany, achievementFindMany, classroomStudentFindMany, dailyChallengeFindUnique;

  beforeEach(() => {
    kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
    moduleFindMany = vi.spyOn(prisma.module, 'findMany').mockResolvedValue(MOCK_MODULES);
    achievementFindMany = vi.spyOn(prisma.achievement, 'findMany').mockResolvedValue([]);
    classroomStudentFindMany = vi.spyOn(prisma.classroomStudent, 'findMany').mockResolvedValue([]);
    dailyChallengeFindUnique = vi.spyOn(prisma.dailyChallenge, 'findUnique').mockResolvedValue(null);
    // Default: active parent
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(
      buildParentUser('active')
    );
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('returns isPremium=true when subscriptionStatus is "active"', async () => {
    userFindUnique.mockResolvedValue(buildParentUser('active'));

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.isPremium).toBe(true);
  });

  it('returns isPremium=true when subscriptionStatus is "trialing" and trialEndsAt is in the future', async () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days ahead
    userFindUnique.mockResolvedValue(buildParentUser('trialing', futureDate));

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.isPremium).toBe(true);
  });

  it('returns isPremium=false when subscriptionStatus is "trialing" and trialEndsAt is in the past (expired)', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    userFindUnique.mockResolvedValue(buildParentUser('trialing', pastDate));

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.isPremium).toBe(false);
  });

  it('returns isPremium=false when subscriptionStatus is "none"', async () => {
    userFindUnique.mockResolvedValue(buildParentUser('none'));

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.isPremium).toBe(false);
  });

  it('response includes subscription object with status, trialEndsAt, subscriptionEnd fields', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    userFindUnique.mockResolvedValue(buildParentUser('trialing', futureDate, null));

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('subscription');
    expect(res.body.subscription).toHaveProperty('status');
    expect(res.body.subscription).toHaveProperty('trialEndsAt');
    expect(res.body.subscription).toHaveProperty('subscriptionEnd');
    expect(res.body.subscription.status).toBe('trialing');
  });
});
