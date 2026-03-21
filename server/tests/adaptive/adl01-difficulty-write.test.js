import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { applySM2, classifyAccuracy, getHardThreshold, getThresholds } = require('../../src/lib/sm2');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a date string for N days from today (UTC date portion). */
function futureDateStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TODAY = new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// SM-2 pure function tests
// ---------------------------------------------------------------------------

describe('applySM2 — pure function', () => {
  it('reviewCount 0, passing score (80%): interval stays 1, easeFactor unchanged at q=4', () => {
    // q = (80/100)*5 = 4.0 → boost = 0.1 - (5-4)*(0.08 + (5-4)*0.02) = 0.1 - 0.1 = 0
    const result = applySM2({ interval: 1, easeFactor: 2.5, reviewCount: 0 }, 80);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.5, 5);
    expect(result.reviewCount).toBe(1);
    expect(result.dueDate.toISOString().slice(0, 10)).toBe(futureDateStr(1));
    expect(result.lastReviewedAt.toISOString().slice(0, 10)).toBe(TODAY);
  });

  it('reviewCount 1, passing score (80%): interval jumps to 6', () => {
    const result = applySM2({ interval: 1, easeFactor: 2.5, reviewCount: 1 }, 80);
    expect(result.interval).toBe(6);
    expect(result.reviewCount).toBe(2);
    expect(result.dueDate.toISOString().slice(0, 10)).toBe(futureDateStr(6));
  });

  it('reviewCount 2, passing score (80%): interval = round(6 * easeFactor)', () => {
    const result = applySM2({ interval: 6, easeFactor: 2.5, reviewCount: 2 }, 80);
    expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
    expect(result.reviewCount).toBe(3);
  });

  it('failing score (40%): interval resets to 1, easeFactor unchanged', () => {
    const result = applySM2({ interval: 6, easeFactor: 2.5, reviewCount: 2 }, 40);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.5, 5); // unchanged on failure
    expect(result.reviewCount).toBe(3);
    expect(result.dueDate.toISOString().slice(0, 10)).toBe(futureDateStr(1));
  });

  it('easeFactor never drops below 1.3 floor', () => {
    // Very low passing score repeatedly degrades easeFactor — floor must hold
    let state = { interval: 6, easeFactor: 1.35, reviewCount: 5 };
    state = applySM2(state, 60); // q = 3.0 — just at threshold
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('high score (100%): maximum easeFactor boost applied', () => {
    const result = applySM2({ interval: 1, easeFactor: 2.5, reviewCount: 0 }, 100);
    // q = 5, boost = 0.1 - 0*(0.08 + 0*0.02) = 0.1
    expect(result.easeFactor).toBeCloseTo(2.6, 5);
    expect(result.interval).toBe(1);
  });

  it('score exactly 60% (q=3): treated as passing', () => {
    const result = applySM2({ interval: 6, easeFactor: 2.5, reviewCount: 2 }, 60);
    // q = 3.0, which is >= 3
    expect(result.interval).toBe(Math.round(6 * 2.5));
  });

  it('score just below 60% (q<3): treated as failing', () => {
    const result = applySM2({ interval: 6, easeFactor: 2.5, reviewCount: 2 }, 59);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(2.5, 5);
  });
});

// ---------------------------------------------------------------------------
// classifyAccuracy tests
// ---------------------------------------------------------------------------

describe('classifyAccuracy — age-adjusted thresholds', () => {
  it("ageGroup '7-8': >= 80 is easy", () => {
    expect(classifyAccuracy(85, '7-8')).toBe('easy');
    expect(classifyAccuracy(80, '7-8')).toBe('easy');
  });

  it("ageGroup '7-8': >= 65 and < 80 is medium", () => {
    expect(classifyAccuracy(70, '7-8')).toBe('medium');
    expect(classifyAccuracy(65, '7-8')).toBe('medium');
  });

  it("ageGroup '7-8': < 65 is hard", () => {
    expect(classifyAccuracy(60, '7-8')).toBe('hard');
    expect(classifyAccuracy(64, '7-8')).toBe('hard');
  });

  it("ageGroup '3-4': >= 70 is easy, >= 50 is medium, < 50 is hard", () => {
    expect(classifyAccuracy(75, '3-4')).toBe('easy');
    expect(classifyAccuracy(62, '3-4')).toBe('medium');
    expect(classifyAccuracy(49, '3-4')).toBe('hard');
  });

  it("ageGroup '5-6': >= 75 is easy, >= 60 is medium, < 60 is hard", () => {
    expect(classifyAccuracy(80, '5-6')).toBe('easy');
    expect(classifyAccuracy(65, '5-6')).toBe('medium');
    expect(classifyAccuracy(55, '5-6')).toBe('hard');
  });

  it('ageGroup null: uses default (5-6) thresholds', () => {
    expect(classifyAccuracy(75, null)).toBe('easy');
    expect(classifyAccuracy(62, null)).toBe('medium');
    expect(classifyAccuracy(55, null)).toBe('hard');
  });
});

// ---------------------------------------------------------------------------
// getHardThreshold tests
// ---------------------------------------------------------------------------

describe('getHardThreshold', () => {
  it("returns 50 for '3-4'", () => {
    expect(getHardThreshold('3-4')).toBe(50);
  });

  it("returns 60 for '5-6'", () => {
    expect(getHardThreshold('5-6')).toBe(60);
  });

  it("returns 65 for '7-8'", () => {
    expect(getHardThreshold('7-8')).toBe(65);
  });

  it('returns 60 for null (default thresholds)', () => {
    expect(getHardThreshold(null)).toBe(60);
  });

  it('returns numeric value, not an object', () => {
    expect(typeof getHardThreshold('3-4')).toBe('number');
    expect(typeof getHardThreshold(null)).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// Transaction integration tests (filled in Task 2)
// ---------------------------------------------------------------------------

describe('upsertProgress with difficulty tracking', () => {
  // txMock pattern mirrors perf02-transaction.test.js
  // extended with moduleDifficulty and reviewSchedule mocks.
  let txMock;
  let upsertProgress;

  beforeEach(async () => {
    // Set env before dynamic import of progressSync
    process.env.DATABASE_URL =
      process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
    process.env.NODE_ENV = 'test';
    process.env.KID_JWT_SECRET = 'adl01-test-secret';

    // Build txMock with all operations used inside upsertProgress
    txMock = {
      lessonProgress: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({
          id: 'lp-1',
          kidId: 'kid-1',
          lessonId: 'lesson-1',
          starsEarned: 2,
          viewed: true,
          matchScore: 80,
          traceScore: null,
          quizScore: null,
          spellingScore: null,
          phonicsScore: null,
          patternScore: null,
          oddOneOutScore: null,
          scrambleScore: null,
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      kidProfile: {
        update: vi.fn().mockResolvedValue({ id: 'kid-1', coins: 60, totalStars: 12 }),
      },
      moduleDifficulty: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      reviewSchedule: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    // Dynamic import so env vars are set first; re-import each test for fresh mock
    vi.resetModules();
    const mod = await import('../../src/services/progressSync.js');
    upsertProgress = mod.upsertProgress || mod.default?.upsertProgress;

    // Intercept prisma.$transaction to use our txMock
    const prisma = global.prisma || (await import('../../src/lib/db.js')).default;
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(txMock));
    // Stub the streak findUnique (outside transaction)
    vi.spyOn(prisma.kidProfile, 'findUnique').mockResolvedValue({
      id: 'kid-1', currentStreak: 1, lastActivityDate: new Date(),
    });
  });

  it('upserts ModuleDifficulty when lesson has scores', async () => {
    // Return rows with scores from findMany
    txMock.lessonProgress.findMany.mockResolvedValue([
      { matchScore: 80, traceScore: null, quizScore: null, spellingScore: null, phonicsScore: null, patternScore: null, oddOneOutScore: null, scrambleScore: null },
    ]);

    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      moduleSlug: 'animals',
      viewed: true,
      matchScore: 80,
    }, '7-8');

    expect(txMock.moduleDifficulty.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kidId_moduleSlug: { kidId: 'kid-1', moduleSlug: 'animals' } },
        create: expect.objectContaining({ level: 'easy', accuracy: 80 }),
        update: expect.objectContaining({ level: 'easy', accuracy: 80 }),
      }),
    );
  });

  it('skips ModuleDifficulty when no moduleSlug in entry', async () => {
    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      viewed: true,
      matchScore: 80,
    }, '7-8');

    expect(txMock.moduleDifficulty.upsert).not.toHaveBeenCalled();
  });

  it('creates ReviewSchedule when score below hard threshold and no existing row', async () => {
    // Hard threshold for '7-8' is 65; score 60 < 65
    txMock.lessonProgress.upsert.mockResolvedValue({
      id: 'lp-1', kidId: 'kid-1', lessonId: 'lesson-1',
      starsEarned: 1, viewed: true,
      matchScore: 60, traceScore: null, quizScore: null, spellingScore: null,
      phonicsScore: null, patternScore: null, oddOneOutScore: null, scrambleScore: null,
    });
    txMock.reviewSchedule.findUnique.mockResolvedValue(null);

    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      moduleSlug: 'animals',
      viewed: true,
      matchScore: 60,
    }, '7-8');

    expect(txMock.reviewSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kidId: 'kid-1',
          lessonId: 'lesson-1',
          interval: 1,
          easeFactor: 2.5,
          reviewCount: 0,
        }),
      }),
    );
  });

  it('updates ReviewSchedule via SM-2 when existing row found', async () => {
    const existingReview = {
      id: 'rev-1', kidId: 'kid-1', lessonId: 'lesson-1',
      interval: 1, easeFactor: 2.5, reviewCount: 0,
      dueDate: new Date(), lastReviewedAt: null,
    };
    txMock.reviewSchedule.findUnique.mockResolvedValue(existingReview);

    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      moduleSlug: 'animals',
      viewed: true,
      matchScore: 80,
    }, '7-8');

    expect(txMock.reviewSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { kidId_lessonId: { kidId: 'kid-1', lessonId: 'lesson-1' } },
        data: expect.objectContaining({ reviewCount: 1 }),
      }),
    );
  });

  it('does not create ReviewSchedule when score above hard threshold', async () => {
    // Score 80 >= hard threshold 65 for '7-8'
    txMock.lessonProgress.upsert.mockResolvedValue({
      id: 'lp-1', kidId: 'kid-1', lessonId: 'lesson-1',
      starsEarned: 3, viewed: true,
      matchScore: 80, traceScore: null, quizScore: null, spellingScore: null,
      phonicsScore: null, patternScore: null, oddOneOutScore: null, scrambleScore: null,
    });
    txMock.reviewSchedule.findUnique.mockResolvedValue(null);

    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      moduleSlug: 'animals',
      viewed: true,
      matchScore: 80,
    }, '7-8');

    expect(txMock.reviewSchedule.create).not.toHaveBeenCalled();
  });

  it('passes ageGroup null gracefully (uses 5-6 thresholds)', async () => {
    // Score 55 < 60 (default hard threshold) — should trigger ReviewSchedule creation
    txMock.lessonProgress.upsert.mockResolvedValue({
      id: 'lp-1', kidId: 'kid-1', lessonId: 'lesson-1',
      starsEarned: 1, viewed: true,
      matchScore: 55, traceScore: null, quizScore: null, spellingScore: null,
      phonicsScore: null, patternScore: null, oddOneOutScore: null, scrambleScore: null,
    });
    txMock.reviewSchedule.findUnique.mockResolvedValue(null);

    // No ageGroup (undefined) — should not throw
    await upsertProgress('kid-1', {
      lessonId: 'lesson-1',
      moduleSlug: 'animals',
      viewed: true,
      matchScore: 55,
    });

    expect(txMock.reviewSchedule.create).toHaveBeenCalled();
  });
});
