/**
 * Test helpers for server security tests.
 *
 * Mocking strategy:
 * The server uses CJS require() throughout. Vitest's vi.mock() intercepts ESM
 * imports but NOT CJS require() calls. To mock Prisma in route handlers, use
 * vi.spyOn(global.prisma, ...) AFTER importing the app (which initialises
 * global.prisma via lib/db.js).
 *
 * Auth strategy:
 * To bypass Supabase auth validation in tests, sign a kid JWT with the test
 * secret (process.env.KID_JWT_SECRET must be set BEFORE the app is imported so
 * dotenv does not override it). The kid JWT path in auth.js calls verifyKidToken()
 * which uses KID_JWT_SECRET, so no network call is made.
 *
 * Usage example:
 *   import { getTestKidToken, spyOnPrisma } from '../helpers/setup.js';
 *   const { default: app } = await import('../../src/index.js');
 *   const { kidProfile } = spyOnPrisma();
 *   kidProfile.findUnique.mockResolvedValue({ ... });
 */

import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

/** Secret used in all tests — set before dotenv loads so it is not overridden. */
export const TEST_KID_SECRET = 'kids-edu-test-secret-do-not-use-in-production';

/**
 * Call this at the top of a test file (before importing the app) to set the
 * required environment variables.
 */
export function setTestEnv() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
  process.env.NODE_ENV = 'test';
  process.env.KID_JWT_SECRET = TEST_KID_SECRET;
}

/**
 * Generate a signed kid JWT for use in Authorization headers.
 * @param {string} kidId - The kid profile ID to embed as `sub`.
 * @returns {string} Signed JWT.
 */
export function getTestKidToken(kidId = 'test-kid-id') {
  return jwt.sign({ sub: kidId, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });
}

/**
 * Spy on all global.prisma model methods and return them for easy setup.
 * Must be called AFTER the app has been imported.
 * Returns an object with vi.spyOn references keyed by model name.
 */
export function spyOnPrisma() {
  const prisma = global.prisma;
  if (!prisma) throw new Error('global.prisma not set — import the app before calling spyOnPrisma()');

  return {
    kidProfile: {
      findUnique: vi.spyOn(prisma.kidProfile, 'findUnique'),
      findMany: vi.spyOn(prisma.kidProfile, 'findMany'),
      update: vi.spyOn(prisma.kidProfile, 'update'),
      create: vi.spyOn(prisma.kidProfile, 'create'),
      delete: vi.spyOn(prisma.kidProfile, 'delete'),
      upsert: vi.spyOn(prisma.kidProfile, 'upsert'),
    },
    user: {
      findUnique: vi.spyOn(prisma.user, 'findUnique'),
      findMany: vi.spyOn(prisma.user, 'findMany'),
      upsert: vi.spyOn(prisma.user, 'upsert'),
    },
  };
}
