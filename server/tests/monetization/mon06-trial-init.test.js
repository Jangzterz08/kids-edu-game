import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
// No KID_JWT_SECRET needed — we use Supabase mock path
// No SUPABASE_URL/KEY — middleware falls back to mock user { id: 'mock-user-id', email: 'dev@kidsedu.app' }

// Load app — triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

// A non-kid bearer token so decodeTokenType returns 'supabase'
// Value doesn't matter because supabase is null in test mode — mock user is used
const SUPABASE_MOCK_TOKEN = 'supabase-mock-token';

// The mock user injected by auth middleware when supabase is null
const MOCK_USER_ID = 'mock-user-id';
const MOCK_USER_EMAIL = 'dev@kidsedu.app';

const MOCK_DB_USER = {
  id: 'db-user-id',
  supabaseAuthId: MOCK_USER_ID,
  email: MOCK_USER_EMAIL,
  name: 'Test Parent',
  role: 'parent',
  subscriptionStatus: 'trialing',
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  subscriptionEnd: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('MON-06: Trial initialization on parent registration', () => {
  let upsertSpy;

  beforeEach(() => {
    upsertSpy = vi.spyOn(prisma.user, 'upsert').mockResolvedValue(MOCK_DB_USER);
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('POST /api/auth/register for new user: create block has subscriptionStatus=trialing and trialEndsAt ~7 days in future', async () => {
    const beforeCall = Date.now();

    const res = await request
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${SUPABASE_MOCK_TOKEN}`)
      .send({ email: MOCK_USER_EMAIL, name: 'Test Parent', role: 'parent' });

    expect(res.status).toBe(200);
    expect(upsertSpy).toHaveBeenCalledOnce();

    const callArgs = upsertSpy.mock.calls[0][0];

    // create block MUST include subscriptionStatus=trialing
    expect(callArgs.create).toHaveProperty('subscriptionStatus', 'trialing');

    // create block MUST include trialEndsAt within 7 days (+/- 2 minutes tolerance)
    expect(callArgs.create).toHaveProperty('trialEndsAt');
    const trialEndsAt = callArgs.create.trialEndsAt;
    expect(trialEndsAt).toBeInstanceOf(Date);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const toleranceMs = 2 * 60 * 1000; // 2 minutes
    const expectedMin = new Date(beforeCall + sevenDaysMs - toleranceMs);
    const expectedMax = new Date(Date.now() + sevenDaysMs + toleranceMs);
    expect(trialEndsAt >= expectedMin).toBe(true);
    expect(trialEndsAt <= expectedMax).toBe(true);
  });

  it('POST /api/auth/register for existing user: update block does NOT contain subscriptionStatus or trialEndsAt', async () => {
    const res = await request
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${SUPABASE_MOCK_TOKEN}`)
      .send({ email: MOCK_USER_EMAIL, name: 'Test Parent', role: 'parent' });

    expect(res.status).toBe(200);
    expect(upsertSpy).toHaveBeenCalledOnce();

    const callArgs = upsertSpy.mock.calls[0][0];

    // update block MUST NOT include subscription fields (prevents trial reset on re-register)
    expect(callArgs.update).not.toHaveProperty('subscriptionStatus');
    expect(callArgs.update).not.toHaveProperty('trialEndsAt');
  });
});
