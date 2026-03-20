import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'perf02-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';
const { default: app } = await import('../../src/index.js');
import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;
const KID_ID = 'test-kid-perf02';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

describe('PERF-02: upsertProgress uses $transaction', () => {
  let transactionSpy, kidFindUnique, lessonFindFirst;

  beforeEach(() => {
    kidFindUnique = vi.spyOn(prisma.kidProfile, 'findUnique');
    lessonFindFirst = vi.spyOn(prisma.lesson, 'findFirst');
    transactionSpy = vi.spyOn(prisma, '$transaction');

    // resolveWriteAccess needs kid profile
    kidFindUnique.mockResolvedValue({
      id: KID_ID, name: 'Test', coins: 50, totalStars: 10, currentStreak: 1,
      lastActivityDate: new Date(), parentId: 'p1',
    });

    // Lesson slug resolution
    lessonFindFirst.mockResolvedValue({ id: 'lesson-uuid-1', slug: 'a' });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('calls prisma.$transaction exactly once when saving lesson progress', async () => {
    transactionSpy.mockImplementation(async (cb) => {
      const txMock = {
        lessonProgress: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({
            id: 'lp-1', kidId: KID_ID, lessonId: 'lesson-uuid-1',
            starsEarned: 2, viewed: true,
          }),
        },
        kidProfile: {
          update: vi.fn().mockResolvedValue({ id: KID_ID, coins: 60, totalStars: 12 }),
        },
      };
      return cb(txMock);
    });

    const res = await request
      .post(`/api/progress/${KID_ID}/lesson/a`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ viewed: true, matchScore: 70 })
      .expect(200);

    expect(transactionSpy).toHaveBeenCalledOnce();
    expect(res.body).toHaveProperty('starsEarned');
  });

  it('streak update still runs even if outside transaction', async () => {
    // Transaction succeeds
    transactionSpy.mockImplementation(async (cb) => {
      const txMock = {
        lessonProgress: {
          findUnique: vi.fn().mockResolvedValue(null),
          upsert: vi.fn().mockResolvedValue({
            id: 'lp-2', kidId: KID_ID, lessonId: 'lesson-uuid-1',
            starsEarned: 1, viewed: true,
          }),
        },
        kidProfile: {
          update: vi.fn().mockResolvedValue({ id: KID_ID }),
        },
      };
      return cb(txMock);
    });

    const res = await request
      .post(`/api/progress/${KID_ID}/lesson/a`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ viewed: true })
      .expect(200);

    // kidProfile.findUnique should be called outside the transaction for streak
    // (once for resolveWriteAccess, once for streak)
    expect(kidFindUnique).toHaveBeenCalled();
    expect(res.body).toHaveProperty('streakCount');
  });
});
