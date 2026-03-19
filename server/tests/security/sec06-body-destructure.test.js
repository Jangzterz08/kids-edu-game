import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'sec06-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

import jwt from 'jsonwebtoken';

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');

import supertest from 'supertest';
const request = supertest(app);

const prisma = global.prisma;

const KID_ID = 'kid-1';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  currentStreak: 1,
  lastActivityDate: new Date(Date.now() - 86400000), // yesterday — streak will update
  totalStars: 0,
  coins: 0,
};

const MOCK_LESSON = { id: 'lesson-uuid-1', slug: 'a' };

const MOCK_PROGRESS = {
  kidId: KID_ID,
  lessonId: 'lesson-uuid-1',
  starsEarned: 0,
  viewed: false,
  matchScore: null, traceScore: null, quizScore: null,
  spellingScore: null, phonicsScore: null, patternScore: null,
  oddOneOutScore: null, scrambleScore: null,
  attempts: 0,
  completedAt: null,
};

describe('SEC-06: req.body destructured to known fields', () => {
  let kidFindUniqueSpy;
  let lessonFindFirstSpy;
  let kidProfileUpdateSpy;
  let lessonProgressFindUniqueSpy;
  let lessonProgressUpsertSpy;

  beforeEach(() => {
    kidFindUniqueSpy = vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue(MOCK_KID);
    lessonFindFirstSpy = vi.spyOn(prisma.lesson, 'findFirst').mockResolvedValue(MOCK_LESSON);
    kidProfileUpdateSpy = vi.spyOn(prisma.kidProfile, 'update').mockResolvedValue(MOCK_KID);
    lessonProgressFindUniqueSpy = vi.spyOn(prisma.lessonProgress, 'findUnique').mockResolvedValue(null);
    lessonProgressUpsertSpy = vi.spyOn(prisma.lessonProgress, 'upsert').mockResolvedValue({
      ...MOCK_PROGRESS,
      starsEarned: 2,
      coinsDelta: 10,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does NOT propagate extra fields from req.body to upsertProgress', async () => {
    await request
      .post(`/api/progress/${KID_ID}/lesson/a`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({
        viewed: true,
        matchScore: 85,
        evilField: 'hack',
        kidId: 'other-id',
        starsEarned: 999,
      })
      .expect(200);

    // The lessonProgress.upsert call should not contain evilField or kidId in data
    expect(lessonProgressUpsertSpy).toHaveBeenCalledOnce();
    const upsertCall = lessonProgressUpsertSpy.mock.calls[0][0];
    expect(upsertCall.create).not.toHaveProperty('evilField');
    // The kid ID in the upsert should be the authenticated kid, not the body-injected 'other-id'
    expect(upsertCall.create.kidId).toBe(KID_ID);
    expect(upsertCall.create.matchScore).toBe(85);
    expect(upsertCall.create.viewed).toBe(true);
    // starsEarned should be computed, not the client-supplied 999
    // (since we pass starsEarned from req.body but the destructuring doesn't include it)
    expect(upsertCall.create.starsEarned).not.toBe(999);
  });

  it('passes all valid score fields through correctly', async () => {
    await request
      .post(`/api/progress/${KID_ID}/lesson/a`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({
        viewed: true,
        matchScore: 90,
        traceScore: 80,
        quizScore: 70,
        spellingScore: 60,
        phonicsScore: 50,
        patternScore: 40,
        oddOneOutScore: 30,
        scrambleScore: 20,
      })
      .expect(200);

    expect(lessonProgressUpsertSpy).toHaveBeenCalledOnce();
    const upsertCall = lessonProgressUpsertSpy.mock.calls[0][0];
    expect(upsertCall.create.matchScore).toBe(90);
    expect(upsertCall.create.traceScore).toBe(80);
    expect(upsertCall.create.quizScore).toBe(70);
    expect(upsertCall.create.spellingScore).toBe(60);
    expect(upsertCall.create.phonicsScore).toBe(50);
    expect(upsertCall.create.patternScore).toBe(40);
    expect(upsertCall.create.oddOneOutScore).toBe(30);
    expect(upsertCall.create.scrambleScore).toBe(20);
    expect(upsertCall.create.viewed).toBe(true);
    expect(upsertCall.create.kidId).toBe(KID_ID);
    expect(upsertCall.create.lessonId).toBe('lesson-uuid-1');
  });
});
