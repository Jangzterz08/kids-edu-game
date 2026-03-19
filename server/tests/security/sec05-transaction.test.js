import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'sec05-test-secret';
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
  coins: 100,
  unlockedItems: '[]',
};

describe('SEC-05: Prisma transaction for coin purchase', () => {
  let findUniqueSpy;
  let transactionSpy;

  beforeEach(() => {
    findUniqueSpy = vi.spyOn(prisma.kidProfile, 'findUnique');
    transactionSpy = vi.spyOn(prisma, '$transaction');
    // Default: initial kid ownership check
    findUniqueSpy.mockResolvedValue(MOCK_KID);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wraps purchase in prisma.$transaction with interactive callback', async () => {
    transactionSpy.mockImplementation(async (cb) => {
      const txMock = {
        kidProfile: {
          findUnique: vi.fn().mockResolvedValue({ ...MOCK_KID, unlockedItems: '[]' }),
          update: vi.fn().mockResolvedValue({ ...MOCK_KID, coins: 70, unlockedItems: '["frog"]' }),
        },
      };
      return cb(txMock);
    });

    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'frog' })
      .expect(200);

    expect(transactionSpy).toHaveBeenCalledOnce();
    expect(res.body.coins).toBe(70);
  });

  it('returns 400 when item already unlocked inside transaction', async () => {
    transactionSpy.mockImplementation(async (cb) => {
      const txMock = {
        kidProfile: {
          findUnique: vi.fn().mockResolvedValue({ ...MOCK_KID, unlockedItems: '["frog"]' }),
        },
      };
      return cb(txMock);
    });

    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'frog' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Already unlocked');
  });

  it('handles malformed unlockedItems JSON gracefully', async () => {
    transactionSpy.mockImplementation(async (cb) => {
      const txMock = {
        kidProfile: {
          findUnique: vi.fn().mockResolvedValue({ ...MOCK_KID, unlockedItems: '{{bad-json' }),
          update: vi.fn().mockResolvedValue({ ...MOCK_KID, coins: 70, unlockedItems: '["frog"]' }),
        },
      };
      return cb(txMock);
    });

    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'frog' })
      .expect(200);
  });
});
