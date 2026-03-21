import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createRequire } from 'module';

// Set env vars before app load
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_test';
process.env.STRIPE_PRICE_ANNUAL = 'price_annual_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_KEY = '';

const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

// Use CJS require to get the same billing module instance that index.js loaded
const require = createRequire(import.meta.url);
const billing = require('../../src/routes/billing.js');
const stripe = billing.stripe;

const PARENT_WITH_CUSTOMER = {
  id: 'parent-db-id',
  supabaseAuthId: 'mock-user-id',
  email: 'parent@test.com',
  role: 'parent',
  subscriptionStatus: 'active',
  stripeCustomerId: 'cus_existing123',
};

const PARENT_WITHOUT_CUSTOMER = {
  id: 'parent-db-id',
  supabaseAuthId: 'mock-user-id',
  email: 'parent@test.com',
  role: 'parent',
  subscriptionStatus: 'none',
  stripeCustomerId: null,
};

describe('MON-04: Billing portal', () => {
  let userFindUnique;
  let portalCreate;

  beforeEach(() => {
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(PARENT_WITH_CUSTOMER);
    portalCreate = vi.spyOn(stripe.billingPortal.sessions, 'create').mockResolvedValue({
      url: 'https://billing.stripe.com/test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/billing/portal with valid stripeCustomerId returns { url: string }', async () => {
    const res = await request
      .get('/api/billing/portal')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(typeof res.body.url).toBe('string');
    expect(portalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing123',
      })
    );
  });

  it('GET /api/billing/portal without stripeCustomerId returns 400', async () => {
    userFindUnique.mockResolvedValue(PARENT_WITHOUT_CUSTOMER);

    const res = await request
      .get('/api/billing/portal')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
