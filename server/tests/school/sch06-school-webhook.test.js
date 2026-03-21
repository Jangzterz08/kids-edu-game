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

const SCHOOL_ID = 'school-001';
const USER_DB_ID = 'user-db-123';
const STRIPE_CUSTOMER_ID = 'cus_test123';
const STRIPE_SUBSCRIPTION_ID = 'sub_test123';
const SCHOOL_SUBSCRIPTION_ID = 'sub_school_456';

const SCHOOL_RECORD = {
  id: SCHOOL_ID,
  name: 'Test School',
  stripeCustomerId: STRIPE_CUSTOMER_ID,
  stripeSubscriptionId: SCHOOL_SUBSCRIPTION_ID,
  licenseStatus: 'active',
  seatCount: 5,
};

function makeSchoolCheckoutEvent() {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_school_123',
        customer: STRIPE_CUSTOMER_ID,
        subscription: SCHOOL_SUBSCRIPTION_ID,
        metadata: { schoolId: SCHOOL_ID, seatCount: '5' },
      },
    },
  };
}

function makeParentCheckoutEvent() {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_parent_123',
        customer: STRIPE_CUSTOMER_ID,
        subscription: STRIPE_SUBSCRIPTION_ID,
        metadata: { userId: USER_DB_ID },
      },
    },
  };
}

function makeSchoolSubscriptionDeletedEvent() {
  return {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: SCHOOL_SUBSCRIPTION_ID,
        ended_at: Math.floor(Date.now() / 1000) - 3600,
      },
    },
  };
}

function makeParentSubscriptionDeletedEvent() {
  return {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: STRIPE_SUBSCRIPTION_ID,
        ended_at: Math.floor(Date.now() / 1000) - 3600,
      },
    },
  };
}

function makeSchoolPaymentFailedEvent() {
  return {
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_school_failed',
        customer: STRIPE_CUSTOMER_ID,
      },
    },
  };
}

describe('SCH-06: School webhook events', () => {
  let constructEventSpy;
  let schoolUpdate;
  let schoolFindFirst;
  let userUpdate;
  let userUpdateMany;

  beforeEach(() => {
    constructEventSpy = vi.spyOn(stripe.webhooks, 'constructEvent');
    schoolUpdate = vi.spyOn(prisma.school, 'update').mockResolvedValue({});
    schoolFindFirst = vi.spyOn(prisma.school, 'findFirst').mockResolvedValue(null); // default: no school
    userUpdate = vi.spyOn(prisma.user, 'update').mockResolvedValue({});
    userUpdateMany = vi.spyOn(prisma.user, 'updateMany').mockResolvedValue({ count: 1 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checkout.session.completed with schoolId metadata calls school.update with licenseStatus=active', async () => {
    const event = makeSchoolCheckoutEvent();
    constructEventSpy.mockReturnValue(event);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(schoolUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SCHOOL_ID },
        data: expect.objectContaining({
          licenseStatus: 'active',
          stripeCustomerId: STRIPE_CUSTOMER_ID,
          stripeSubscriptionId: SCHOOL_SUBSCRIPTION_ID,
        }),
      })
    );
    // user.update should NOT be called for school checkout
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('checkout.session.completed with userId metadata calls user.update (existing behavior preserved)', async () => {
    const event = makeParentCheckoutEvent();
    constructEventSpy.mockReturnValue(event);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_DB_ID },
        data: expect.objectContaining({
          subscriptionStatus: 'active',
          trialEndsAt: null,
        }),
      })
    );
    // school.update should NOT be called for parent checkout
    expect(schoolUpdate).not.toHaveBeenCalled();
  });

  it('customer.subscription.deleted for school subscription calls school.update with licenseStatus=expired', async () => {
    const event = makeSchoolSubscriptionDeletedEvent();
    constructEventSpy.mockReturnValue(event);
    // school found by subscriptionId
    schoolFindFirst.mockResolvedValue(SCHOOL_RECORD);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(schoolUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SCHOOL_ID },
        data: expect.objectContaining({
          licenseStatus: 'expired',
          licenseExpiry: expect.any(Date),
        }),
      })
    );
    // user.updateMany should NOT be called
    expect(userUpdateMany).not.toHaveBeenCalled();
  });

  it('customer.subscription.deleted for parent subscription calls user.updateMany (existing behavior preserved)', async () => {
    const event = makeParentSubscriptionDeletedEvent();
    constructEventSpy.mockReturnValue(event);
    // no school found for this subscription
    schoolFindFirst.mockResolvedValue(null);

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
    expect(schoolUpdate).not.toHaveBeenCalled();
  });

  it('invoice.payment_failed for school customer calls school.update with licenseStatus=past_due', async () => {
    const event = makeSchoolPaymentFailedEvent();
    constructEventSpy.mockReturnValue(event);
    // school found by customerId
    schoolFindFirst.mockResolvedValue(SCHOOL_RECORD);

    const res = await request
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send(JSON.stringify(event));

    expect(res.status).toBe(200);
    expect(schoolUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SCHOOL_ID },
        data: expect.objectContaining({
          licenseStatus: 'past_due',
        }),
      })
    );
    expect(userUpdateMany).not.toHaveBeenCalled();
  });

  it('invoice.payment_failed for parent customer calls user.updateMany (existing behavior preserved)', async () => {
    const event = makeSchoolPaymentFailedEvent();
    constructEventSpy.mockReturnValue(event);
    // no school found
    schoolFindFirst.mockResolvedValue(null);

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
    expect(schoolUpdate).not.toHaveBeenCalled();
  });
});
