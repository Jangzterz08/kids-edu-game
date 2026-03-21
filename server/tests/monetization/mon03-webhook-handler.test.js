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

const USER_DB_ID = 'user-db-123';
const STRIPE_CUSTOMER_ID = 'cus_test123';
const STRIPE_SUBSCRIPTION_ID = 'sub_test123';

function makeCheckoutCompletedEvent() {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer: STRIPE_CUSTOMER_ID,
        subscription: STRIPE_SUBSCRIPTION_ID,
        metadata: { userId: USER_DB_ID },
      },
    },
  };
}

function makeSubscriptionDeletedEvent() {
  return {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: STRIPE_SUBSCRIPTION_ID,
        ended_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      },
    },
  };
}

function makePaymentFailedEvent() {
  return {
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_test_123',
        customer: STRIPE_CUSTOMER_ID,
      },
    },
  };
}

describe('MON-03: Webhook handler', () => {
  let constructEventSpy;
  let userUpdate;
  let userUpdateMany;

  beforeEach(() => {
    constructEventSpy = vi.spyOn(stripe.webhooks, 'constructEvent');
    userUpdate = vi.spyOn(prisma.user, 'update').mockResolvedValue({});
    userUpdateMany = vi.spyOn(prisma.user, 'updateMany').mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkout.session.completed sets subscriptionStatus=active, stores stripeCustomerId and stripeSubscriptionId, clears trialEndsAt', async () => {
    const event = makeCheckoutCompletedEvent();
    constructEventSpy.mockReturnValue(event);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_DB_ID },
        data: expect.objectContaining({
          stripeCustomerId: STRIPE_CUSTOMER_ID,
          stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID,
          subscriptionStatus: 'active',
          trialEndsAt: null,
        }),
      })
    );
  });

  it('customer.subscription.deleted sets subscriptionStatus=canceled and stores subscriptionEnd', async () => {
    const event = makeSubscriptionDeletedEvent();
    constructEventSpy.mockReturnValue(event);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID },
        data: expect.objectContaining({
          subscriptionStatus: 'canceled',
          subscriptionEnd: expect.any(Date),
        }),
      })
    );
  });

  it('invoice.payment_failed sets subscriptionStatus=past_due', async () => {
    const event = makePaymentFailedEvent();
    constructEventSpy.mockReturnValue(event);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(userUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCustomerId: STRIPE_CUSTOMER_ID },
        data: expect.objectContaining({
          subscriptionStatus: 'past_due',
        }),
      })
    );
  });

  it('invalid signature returns 400', async () => {
    constructEventSpy.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send('{"type":"test"}');

    expect(res.status).toBe(400);
  });
});
