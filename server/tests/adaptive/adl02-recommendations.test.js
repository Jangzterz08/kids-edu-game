import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'adl02-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');

import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-adl02';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  name: 'Test Kid',
  avatarId: 'bear',
  totalStars: 20,
  currentStreak: 2,
  coins: 50,
  parentId: 'parent-adl02',
  ageGroup: '5-6',
};

// Helper to build a module row with lessons
function makeModule(slug, sortOrder, withProgress = false) {
  return {
    slug,
    title: `Module ${slug}`,
    iconEmoji: '📚',
    sortOrder,
    lessons: withProgress
      ? [{ slug: `${slug}-l1`, sortOrder: 1, progress: [{ starsEarned: 2, kidId: KID_ID }] }]
      : [{ slug: `${slug}-l1`, sortOrder: 1, progress: [] }],
  };
}

function setupBaseMocks() {
  vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
  vi.spyOn(prisma.achievement, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.classroomStudent, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.dailyChallenge, 'findUnique').mockResolvedValue(null);
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
    subscriptionStatus: 'active',
    trialEndsAt: null,
    subscriptionEnd: null,
  });
  // reviewToday empty for these tests
  vi.spyOn(prisma.reviewSchedule, 'findMany').mockResolvedValue([]);
}

describe('ADL-02: Recommendations in home-summary', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns medium-band modules as recommendations', async () => {
    setupBaseMocks();
    // Two modules with difficulty=medium, two modules untried
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      makeModule('alphabet', 1, true),
      makeModule('numbers', 2, true),
      makeModule('shapes', 3, false),
      makeModule('colors', 4, false),
    ]);
    vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([
      { kidId: KID_ID, moduleSlug: 'alphabet', level: 'medium', accuracy: 65 },
      { kidId: KID_ID, moduleSlug: 'numbers',  level: 'medium', accuracy: 70 },
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('recommendations');
    const rec = res.body.recommendations;
    const recSlugs = rec.map(r => r.moduleSlug);
    expect(recSlugs).toContain('alphabet');
    expect(recSlugs).toContain('numbers');
  });

  it('fills remaining slots with untried modules sorted by sortOrder', async () => {
    setupBaseMocks();
    // 1 medium, 3 untried modules
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      makeModule('alphabet', 1, true),  // medium
      makeModule('numbers',  2, false), // untried
      makeModule('shapes',   3, false), // untried
      makeModule('colors',   4, false), // untried
    ]);
    vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([
      { kidId: KID_ID, moduleSlug: 'alphabet', level: 'medium', accuracy: 65 },
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    const rec = res.body.recommendations;
    expect(rec).toHaveLength(3);
    // alphabet (medium) should be included
    expect(rec.map(r => r.moduleSlug)).toContain('alphabet');
    // 2 untried modules should fill remaining slots
    const untriedInRec = rec.filter(r => r.moduleSlug !== 'alphabet');
    expect(untriedInRec).toHaveLength(2);
  });

  it('caps at 3 recommendations even when more medium modules exist', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      makeModule('alphabet', 1, true),
      makeModule('numbers',  2, true),
      makeModule('shapes',   3, true),
      makeModule('colors',   4, true),
      makeModule('animals',  5, true),
    ]);
    vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([
      { kidId: KID_ID, moduleSlug: 'alphabet', level: 'medium', accuracy: 65 },
      { kidId: KID_ID, moduleSlug: 'numbers',  level: 'medium', accuracy: 68 },
      { kidId: KID_ID, moduleSlug: 'shapes',   level: 'medium', accuracy: 63 },
      { kidId: KID_ID, moduleSlug: 'colors',   level: 'medium', accuracy: 72 },
      { kidId: KID_ID, moduleSlug: 'animals',  level: 'medium', accuracy: 67 },
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.recommendations).toHaveLength(3);
  });

  it('returns empty recommendations when no medium and no untried modules', async () => {
    setupBaseMocks();
    // All modules have progress and are classified as easy
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      makeModule('alphabet', 1, true),
      makeModule('numbers',  2, true),
    ]);
    vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([
      { kidId: KID_ID, moduleSlug: 'alphabet', level: 'easy', accuracy: 92 },
      { kidId: KID_ID, moduleSlug: 'numbers',  level: 'easy', accuracy: 95 },
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.recommendations).toEqual([]);
  });

  it('includes moduleSlug, title, and iconEmoji in each recommendation', async () => {
    setupBaseMocks();
    vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      makeModule('alphabet', 1, true),
    ]);
    vi.spyOn(prisma.moduleDifficulty, 'findMany').mockResolvedValue([
      { kidId: KID_ID, moduleSlug: 'alphabet', level: 'medium', accuracy: 65 },
    ]);

    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    const rec = res.body.recommendations;
    expect(rec).toHaveLength(1);
    expect(rec[0]).toHaveProperty('moduleSlug', 'alphabet');
    expect(rec[0]).toHaveProperty('title');
    expect(rec[0]).toHaveProperty('iconEmoji');
  });
});
