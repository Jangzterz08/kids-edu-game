import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env before any require() calls so db.js does not throw on invalid URL
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'infra02-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';
const { default: app } = await import('../../src/index.js');
import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-infra02';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

describe('INFRA-04: GET /api/progress/:kidId/stats gameAccuracy new keys', () => {
  let kidFindUnique, lessonProgressFindMany, moduleFindMany;

  beforeEach(() => {
    kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue({
      id: KID_ID, totalStars: 10, currentStreak: 1, parentId: 'parent-1',
    });
    lessonProgressFindMany = vi.spyOn(prisma.lessonProgress, 'findMany').mockResolvedValue([
      {
        matchScore: 80, traceScore: null, quizScore: null,
        spellingScore: null, phonicsScore: null, patternScore: null,
        oddOneOutScore: null, scrambleScore: null,
        sortScore: 85, trueFalseScore: 90, memoryMatchScore: 75,
        starsEarned: 2, updatedAt: new Date(),
      },
    ]);
    moduleFindMany = vi.spyOn(prisma.module, 'findMany').mockResolvedValue([]);
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('Test 1: gameAccuracy contains sortScore, trueFalseScore, and memoryMatchScore keys', async () => {
    const res = await request
      .get(`/api/progress/${KID_ID}/stats`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('gameAccuracy');
    expect(res.body.gameAccuracy).toHaveProperty('sortScore');
    expect(res.body.gameAccuracy).toHaveProperty('trueFalseScore');
    expect(res.body.gameAccuracy).toHaveProperty('memoryMatchScore');
  });

  it('Test 2: gameAccuracy contains scramble key (pre-existing gap fix)', async () => {
    const res = await request
      .get(`/api/progress/${KID_ID}/stats`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('gameAccuracy');
    expect(res.body.gameAccuracy).toHaveProperty('scramble');
  });

  it('Test 3: gameAccuracy.sortScore returns average when progress records have sortScore values', async () => {
    // lessonProgressFindMany returns a record with sortScore: 85
    const res = await request
      .get(`/api/progress/${KID_ID}/stats`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(res.body.gameAccuracy.sortScore).toBe(85);
    expect(res.body.gameAccuracy.trueFalseScore).toBe(90);
    expect(res.body.gameAccuracy.memoryMatchScore).toBe(75);
  });
});
