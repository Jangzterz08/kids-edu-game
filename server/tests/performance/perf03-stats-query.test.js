import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'perf03-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';
const { default: app } = await import('../../src/index.js');
import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-perf03';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

describe('PERF-03: GET /api/progress/:kidId/stats uses parallel queries', () => {
  let kidFindUnique, lessonProgressFindMany, moduleFindMany;

  beforeEach(() => {
    kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue({
      id: KID_ID, totalStars: 20, currentStreak: 2, parentId: 'p1',
    });
    lessonProgressFindMany = vi.spyOn(prisma.lessonProgress, 'findMany').mockResolvedValue([
      { matchScore: 80, traceScore: null, quizScore: 70, spellingScore: null, phonicsScore: null, patternScore: null, oddOneOutScore: null, starsEarned: 2, updatedAt: new Date() },
    ]);
    moduleFindMany = vi.spyOn(prisma.module, 'findMany').mockResolvedValue([
      { slug: 'alphabet', title: 'Alphabet', iconEmoji: '🔤', sortOrder: 1, lessons: [{ progress: [{ starsEarned: 2 }] }] },
    ]);
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('calls prisma.module.findMany exactly once (not twice)', async () => {
    const res = await request
      .get(`/api/progress/${KID_ID}/stats`)
      .set('Authorization', `Bearer ${kidToken}`)
      .expect(200);

    expect(moduleFindMany).toHaveBeenCalledOnce();
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('gameAccuracy');
    expect(res.body).toHaveProperty('weeklyActivity');
    expect(res.body).toHaveProperty('recommended');
  });
});
