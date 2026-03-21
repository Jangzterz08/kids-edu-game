import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'adl03-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');

import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-adl03';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  name: 'Test Kid',
  avatarId: 'bear',
  totalStars: 15,
  currentStreak: 1,
  coins: 30,
  parentId: 'parent-adl03',
  ageGroup: '5-6',
};

const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday

// Helper to build a ReviewSchedule row with nested lesson
function makeSchedule(lessonId, accuracy, lastReviewedAt = null, daysAgo = 1) {
  const dueDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    id: `rs-${lessonId}`,
    kidId: KID_ID,
    lessonId,
    dueDate,
    interval: 1,
    easeFactor: 2.5,
    reviewCount: 1,
    lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
    lesson: {
      id: lessonId,
      slug: `lesson-${lessonId}`,
      title: `Lesson ${lessonId}`,
      module: {
        slug: `module-${lessonId}`,
        title: `Module ${lessonId}`,
        iconEmoji: '📚',
      },
      progress: [{
        kidId: KID_ID,
        // Set quizScore to simulate accuracy
        quizScore: accuracy,
        matchScore: null,
        traceScore: null,
        spellingScore: null,
        phonicsScore: null,
        patternScore: null,
        oddOneOutScore: null,
        scrambleScore: null,
      }],
    },
  };
}

function setupBaseMocks() {
  vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
  vi.spyOn(prisma.module, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.achievement, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.classroomStudent, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.dailyChallenge, 'findUnique').mockResolvedValue(null);
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
    subscriptionStatus: 'active',
    trialEndsAt: null,
    subscriptionEnd: null,
  });
  // recommendations empty for these tests
  vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([]);
}

describe('ADL-03: Review Today in home-summary', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns lessons with dueDate <= today in reviewToday', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([
      makeSchedule('lesson-1', 60),
      makeSchedule('lesson-2', 80),
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('reviewToday');
    expect(res.body.reviewToday).toHaveLength(2);
  });

  it('sorts by lowest accuracy first', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([
      makeSchedule('lesson-high',   80),
      makeSchedule('lesson-low',    40),
      makeSchedule('lesson-medium', 60),
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    const items = res.body.reviewToday;
    expect(items).toHaveLength(3);
    // Should be sorted ascending by accuracy: 40, 60, 80
    expect(items[0].accuracy).toBeLessThanOrEqual(items[1].accuracy);
    expect(items[1].accuracy).toBeLessThanOrEqual(items[2].accuracy);
    expect(items[0].lessonId).toBe('lesson-low');
    expect(items[2].lessonId).toBe('lesson-high');
  });

  it('breaks ties by oldest lastReviewedAt', async () => {
    setupBaseMocks();
    const olderDate = '2026-03-10T00:00:00.000Z';
    const newerDate = '2026-03-15T00:00:00.000Z';
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([
      makeSchedule('lesson-newer', 70, newerDate),
      makeSchedule('lesson-older', 70, olderDate),
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    const items = res.body.reviewToday;
    expect(items).toHaveLength(2);
    // Older lastReviewedAt should come first (same accuracy)
    expect(items[0].lessonId).toBe('lesson-older');
    expect(items[1].lessonId).toBe('lesson-newer');
  });

  it('caps at 3 items even when more are due', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([
      makeSchedule('lesson-1', 55),
      makeSchedule('lesson-2', 60),
      makeSchedule('lesson-3', 65),
      makeSchedule('lesson-4', 70),
      makeSchedule('lesson-5', 75),
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.reviewToday).toHaveLength(3);
  });

  it('returns empty reviewToday when no lessons are due', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.reviewToday).toEqual([]);
  });

  it('includes expected fields in each reviewToday item', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([
      makeSchedule('lesson-abc', 72),
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    const item = res.body.reviewToday[0];
    expect(item).toHaveProperty('lessonId', 'lesson-abc');
    expect(item).toHaveProperty('lessonSlug');
    expect(item).toHaveProperty('lessonTitle');
    expect(item).toHaveProperty('moduleSlug');
    expect(item).toHaveProperty('moduleTitle');
    expect(item).toHaveProperty('moduleIconEmoji');
    expect(item).toHaveProperty('accuracy');
    expect(item).toHaveProperty('dueDate');
  });
});
