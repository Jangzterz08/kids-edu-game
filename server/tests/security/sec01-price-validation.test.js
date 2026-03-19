import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'sec01-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

// Load the app — this triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);

// Access the real prisma instance (set by lib/db.js via global singleton)
const prisma = global.prisma;

// Generate a valid kid JWT signed with TEST_KID_SECRET
// auth.js decodeTokenType returns 'kid' → verifyKidToken uses process.env.KID_JWT_SECRET
const KID_ID = 'kid-db-id';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_KID = {
  id: KID_ID,
  parentId: 'parent-db-id',
  coins: 100,
  unlockedItems: '[]',
};

describe('SEC-01: Server-side price validation', () => {
  let findUniqueSpy;
  let updateSpy;

  beforeEach(() => {
    findUniqueSpy = vi.spyOn(prisma.kidProfile, 'findUnique');
    updateSpy = vi.spyOn(prisma.kidProfile, 'update');
    // Default: kid found
    findUniqueSpy.mockResolvedValue(MOCK_KID);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/kids/:id/store/buy with price:0 deducts canonical price, not zero', async () => {
    updateSpy.mockResolvedValue({
      ...MOCK_KID,
      coins: 70,
      unlockedItems: '["frog"]',
    });

    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'frog', price: 0 });

    expect(res.status).toBe(200);
    // Must use canonical price 30, NOT client-supplied 0
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coins: { decrement: 30 },
        }),
      })
    );
    expect(res.body.coins).toBe(70);
  });

  it('POST /api/kids/:id/store/buy with unknown itemId returns 400', async () => {
    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'nonexistent' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Unknown item/i);
  });

  it('POST /api/kids/:id/store/buy without itemId returns 400', async () => {
    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/itemId is required/i);
  });

  it('POST /api/kids/:id/store/buy ignores client-supplied price field entirely', async () => {
    updateSpy.mockResolvedValue({
      ...MOCK_KID,
      coins: 60,
      unlockedItems: '["chick"]',
    });

    const res = await request
      .post(`/api/kids/${KID_ID}/store/buy`)
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ itemId: 'chick', price: 9999 });

    expect(res.status).toBe(200);
    // Must use canonical price 40, not 9999
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          coins: { decrement: 40 },
        }),
      })
    );
  });
});
