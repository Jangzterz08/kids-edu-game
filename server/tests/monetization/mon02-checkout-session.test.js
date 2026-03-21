import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';

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

// Import stripe to spy on it
const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);

const PARENT_USER = {
  id: 'parent-db-id',
  supabaseAuthId: 'mock-user-id',
  email: 'parent@test.com',
  role: 'parent',
  subscriptionStatus: 'none',
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  trialEndsAt: null,
};

const PARENT_WITH_CUSTOMER = {
  ...PARENT_USER,
  stripeCustomerId: 'cus_existing123',
};

describe('MON-02: Checkout session creation', () => {
  let userFindUnique;
  let checkoutCreate;

  beforeEach(() => {
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(PARENT_USER);
    checkoutCreate = vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/billing/checkout with valid monthly priceId returns { url: string }', async () => {
    const res = await request
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ priceId: 'price_monthly_test' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(typeof res.body.url).toBe('string');
  });

  it('POST /api/billing/checkout with valid annual priceId returns { url: string }', async () => {
    const res = await request
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ priceId: 'price_annual_test' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(typeof res.body.url).toBe('string');
  });

  it('POST /api/billing/checkout with unknown priceId returns 400', async () => {
    const res = await request
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ priceId: 'price_unknown_garbage' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/billing/checkout uses customer (not customer_email) when stripeCustomerId exists', async () => {
    userFindUnique.mockResolvedValue(PARENT_WITH_CUSTOMER);

    const res = await request
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ priceId: 'price_monthly_test' });

    expect(res.status).toBe(200);
    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing123',
      })
    );
    // Should NOT have customer_email when customer is set
    const callArgs = checkoutCreate.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('customer_email');
  });
});
