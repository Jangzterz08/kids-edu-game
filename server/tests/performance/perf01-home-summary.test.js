import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'perf01-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');

import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-perf01';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  name: 'Test Kid',
  avatarId: 'bear',
  totalStars: 50,
  currentStreak: 3,
  coins: 120,
  parentId: 'parent-1',
};

describe('PERF-01: GET /api/kids/:kidId/home-summary', () => {
  let kidFindUnique, moduleFindMany, achievementFindMany, classroomStudentFindMany, dailyChallengeFindUnique;

  beforeEach(() => {
    kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
    moduleFindMany = vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      {
        slug: 'alphabet', title: 'Alphabet', iconEmoji: '🔤', sortOrder: 1,
        lessons: [
          { slug: 'a', sortOrder: 1, progress: [{ starsEarned: 3 }] },
          { slug: 'b', sortOrder: 2, progress: [] },
        ],
      },
    ]);
    achievementFindMany = vi.spyOn(prisma.achievement, 'findMany').mockResolvedValue([
      { id: 'ach-1', type: 'module_complete', moduleSlug: 'alphabet', kidId: KID_ID },
    ]);
    classroomStudentFindMany = vi.spyOn(prisma.classroomStudent, 'findMany').mockResolvedValue([]);
    dailyChallengeFindUnique = vi.spyOn(prisma.dailyChallenge, 'findUnique').mockResolvedValue(null);
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('returns aggregated response with kid, progress, achievements, classrooms, dailyChallenge', async () => {
    const res = await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('kid');
    expect(res.body).toHaveProperty('progress');
    expect(res.body).toHaveProperty('achievements');
    expect(res.body).toHaveProperty('classrooms');
    expect(res.body).toHaveProperty('dailyChallenge');
    expect(res.body.kid.id).toBe(KID_ID);
    expect(res.body.kid.totalStars).toBe(50);
    expect(res.body.kid.currentStreak).toBe(3);
    expect(res.body.kid.coins).toBe(120);
    expect(res.body.progress).toHaveLength(1);
    expect(res.body.progress[0].moduleSlug).toBe('alphabet');
    expect(res.body.progress[0].lessonsCompleted).toBe(1);
    expect(res.body.progress[0].lessonsTotal).toBe(2);
    expect(res.body.achievements).toHaveLength(1);
    expect(res.body.dailyChallenge).toHaveProperty('moduleSlug');
    expect(res.body.dailyChallenge).toHaveProperty('completedAt');
  });

  it('returns 404 for unauthorized kid access', async () => {
    const otherToken = jwt.sign({ sub: 'other-kid', type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

    kidFindUnique.mockResolvedValue(null);

    await request
      .get(`/api/kids/${KID_ID}/home-summary`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
  });
});
