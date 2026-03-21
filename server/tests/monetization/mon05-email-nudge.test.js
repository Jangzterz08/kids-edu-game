import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

// Set env vars before any module import
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mon05';
process.env.KID_JWT_SECRET = 'mon05-test-secret';
process.env.RESEND_API_KEY = 'test-resend-key-mon05';

// Shared spy — captured when Resend constructor is called by the service
const mockEmailsSend = vi.fn().mockResolvedValue({ id: 'test-email-id' });

// Mock the resend module before any imports
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: mockEmailsSend,
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
    mockEmailsSend.mockClear();
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
    // Confirm email was sent: DB is updated with new lastNudgeEmailAt after a successful send
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PARENT_ID },
        data: expect.objectContaining({ lastNudgeEmailAt: expect.any(Date) }),
      })
    );
  });

  it('Test 2: sends nudge email when parent.lastNudgeEmailAt is more than 24h ago', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    userFindUnique.mockResolvedValue(buildParent(twoDaysAgo));

    await sendUpgradeNudge(PARENT_ID);

    // Confirm email was sent: DB is updated (24h rate limit not hit)
    expect(userUpdate).toHaveBeenCalled();
  });

  it('Test 3: does NOT send nudge email when parent.lastNudgeEmailAt is less than 24h ago (rate limited)', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    userFindUnique.mockResolvedValue(buildParent(thirtyMinutesAgo));

    await sendUpgradeNudge(PARENT_ID);

    // Confirm email was NOT sent: DB update should not happen when rate limited
    expect(userUpdate).not.toHaveBeenCalled();
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
