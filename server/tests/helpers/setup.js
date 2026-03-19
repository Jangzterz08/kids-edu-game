import { vi } from 'vitest';

// Set env vars before any module is loaded
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.KID_JWT_SECRET = 'test-secret-for-tests-only';

// Mock Prisma before requiring app
export const mockPrisma = {
  kidProfile: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  lesson: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  lessonProgress: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  module: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  classroom: {
    findUnique: vi.fn(),
  },
  classroomStudent: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../src/lib/db', () => mockPrisma);

// Mock auth middleware to inject test user
let testUser = { id: 'test-kid-id', type: 'kid' };
vi.mock('../../src/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = testUser;
    next();
  },
}));

export function setTestUser(user) {
  testUser = user;
}

export function getApp() {
  return require('../../src/index');
}
