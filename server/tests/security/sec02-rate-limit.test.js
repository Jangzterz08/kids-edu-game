import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env vars before app load
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.KID_JWT_SECRET = 'test-secret-for-tests-only';

// Mock Prisma
const mockPrisma = {
  kidProfile: {
    findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(),
    create: vi.fn(), delete: vi.fn(), upsert: vi.fn(),
  },
  user: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
  lesson: { findFirst: vi.fn(), findMany: vi.fn() },
  lessonProgress: { findUnique: vi.fn(), upsert: vi.fn(), findMany: vi.fn() },
  module: { findMany: vi.fn(), findUnique: vi.fn() },
  classroom: { findUnique: vi.fn() },
  classroomStudent: {
    findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
    create: vi.fn(), delete: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../src/lib/db', () => mockPrisma);

vi.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'test-kid-id', type: 'kid' };
    next();
  },
}));

import supertest from 'supertest';

const app = await import('../../src/index.js').then(m => m.default || m);
const request = supertest(app);

describe('SEC-02: Rate limiting on kid auth endpoints', () => {
  it('First 10 requests to /api/auth/kid-login succeed (not rate-limited)', async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request
        .post('/api/auth/kid-login')
        .send({ pin: '1234', kidId: 'test' });
      expect(res.status).not.toBe(429);
    }
  });

  it('11th POST to /api/auth/kid-login within 60s returns 429', async () => {
    // First 10 may already be done from previous test; just keep sending
    // Since rate limit is per IP and in-memory, after 10 total we should get 429
    // Send 11 total to ensure we exceed the limit
    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await request
        .post('/api/auth/kid-login')
        .send({ pin: '1234', kidId: 'test' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('11th POST to /api/auth/kid-lookup within 60s returns 429', async () => {
    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await request
        .post('/api/auth/kid-lookup')
        .send({ name: 'test' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
