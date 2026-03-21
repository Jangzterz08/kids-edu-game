import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

// Set env vars before any module import
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mon05';
process.env.KID_JWT_SECRET = 'mon05-test-secret';
process.env.RESEND_API_KEY = 'test-resend-key-mon05';

// Mock the resend module before any imports
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  })),
}));

// Load the app to initialize global.prisma
await import('../../src/index.js');
const prisma = global.prisma;

// Load sendUpgradeNudge via createRequire (CJS module)
const require = createRequire(import.meta.url);
const { sendUpgradeNudge } = require('../../src/services/upgradeNudge');

const PARENT_ID = 'parent-mon05-test';

function buildParent(lastNudgeEmailAt = null) {
  return {
    id: PARENT_ID,
    email: 'parent@test.com',
    name: 'Test Parent',
    lastNudgeEmailAt,
  };
}

describe('MON-05: sendUpgradeNudge', () => {
  let userFindUnique, userUpdate;

  beforeEach(() => {
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(buildParent(null));
    userUpdate = vi.spyOn(prisma.user, 'update').mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1: sends nudge email when parent.lastNudgeEmailAt is null (never nudged)', async () => {
    userFindUnique.mockResolvedValue(buildParent(null));

    await sendUpgradeNudge(PARENT_ID);

    expect(userFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PARENT_ID } })
    );

    // Verify resend.emails.send was called — check via the mock
    const { Resend } = require('resend');
    const resendInstance = Resend.mock.results[0]?.value;
    expect(resendInstance.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'parent@test.com',
        subject: expect.stringContaining('premium'),
      })
    );
  });

  it('Test 2: sends nudge email when parent.lastNudgeEmailAt is more than 24h ago', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    userFindUnique.mockResolvedValue(buildParent(twoDaysAgo));

    await sendUpgradeNudge(PARENT_ID);

    const { Resend } = require('resend');
    const resendInstance = Resend.mock.results[0]?.value;
    expect(resendInstance.emails.send).toHaveBeenCalled();
  });

  it('Test 3: does NOT send nudge email when parent.lastNudgeEmailAt is less than 24h ago (rate limited)', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    userFindUnique.mockResolvedValue(buildParent(thirtyMinutesAgo));

    await sendUpgradeNudge(PARENT_ID);

    const { Resend } = require('resend');
    const resendInstance = Resend.mock.results[0]?.value;
    expect(resendInstance.emails.send).not.toHaveBeenCalled();
  });

  it('Test 4: updates lastNudgeEmailAt in DB after successful send', async () => {
    userFindUnique.mockResolvedValue(buildParent(null));

    await sendUpgradeNudge(PARENT_ID);

    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PARENT_ID },
        data: expect.objectContaining({ lastNudgeEmailAt: expect.any(Date) }),
      })
    );
  });

  it('Test 5: does not throw when RESEND_API_KEY is missing (graceful skip)', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    await expect(sendUpgradeNudge(PARENT_ID)).resolves.toBeUndefined();

    process.env.RESEND_API_KEY = originalKey;
  });
});
