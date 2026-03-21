import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createRequire } from 'module';

// Set env vars before app load
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_PRICE_SCHOOL_TIER_1 = 'price_school_tier1_test';
process.env.STRIPE_PRICE_SCHOOL_TIER_2 = 'price_school_tier2_test';
process.env.STRIPE_PRICE_SCHOOL_TIER_3 = 'price_school_tier3_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_KEY = '';

const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

// Use CJS require to get the same schoolBilling module instance that index.js loaded
const require = createRequire(import.meta.url);
const schoolBilling = require('../../src/routes/schoolBilling.js');
const stripe = schoolBilling.stripe;

const TEACHER_USER = {
  id: 'teacher-db-id',
  supabaseAuthId: 'mock-user-id',
  email: 'admin@school.com',
  role: 'teacher',
};

const SCHOOL = {
  id: 'school-001',
  name: 'Test School',
  contactEmail: 'admin@school.com',
  stripeCustomerId: null,
  licenseStatus: 'none',
  licenseExpiry: null,
  seatCount: 5,
};

const ADMIN_MEMBERSHIP = {
  id: 'st-001',
  userId: 'teacher-db-id',
  schoolId: 'school-001',
  role: 'admin',
  school: SCHOOL,
};

describe('SCH-02: School checkout session creation', () => {
  let userFindUnique;
  let schoolTeacherFindUnique;
  let checkoutCreate;

  beforeEach(() => {
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(TEACHER_USER);
    schoolTeacherFindUnique = vi.spyOn(prisma.schoolTeacher, 'findUnique').mockResolvedValue(ADMIN_MEMBERSHIP);
    checkoutCreate = vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
      url: 'https://checkout.stripe.com/test',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/billing/school-checkout with tier_1 plan returns { url: string }', async () => {
    const res = await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'tier_1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(typeof res.body.url).toBe('string');
  });

  it('POST /api/billing/school-checkout with tier_2 plan returns { url: string }', async () => {
    const res = await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'tier_2' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
  });

  it('POST /api/billing/school-checkout with invalid plan returns 400', async () => {
    const res = await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'enterprise_garbage' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/billing/school-checkout by non-admin teacher returns 403', async () => {
    schoolTeacherFindUnique.mockResolvedValue({
      ...ADMIN_MEMBERSHIP,
      role: 'teacher', // not admin
    });

    const res = await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'tier_1' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/billing/school-checkout calls stripe.checkout.sessions.create with metadata.schoolId and seatCount', async () => {
    await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'tier_1' });

    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          schoolId: 'school-001',
          seatCount: '5',
        }),
      })
    );
  });

  it('POST /api/billing/school-checkout uses existing stripeCustomerId when available', async () => {
    const schoolWithCustomer = { ...SCHOOL, stripeCustomerId: 'cus_school_123' };
    schoolTeacherFindUnique.mockResolvedValue({
      ...ADMIN_MEMBERSHIP,
      school: schoolWithCustomer,
    });

    await request
      .post('/api/billing/school-checkout')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ plan: 'tier_1' });

    expect(checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_school_123' })
    );
    const callArgs = checkoutCreate.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('customer_email');
  });
});
