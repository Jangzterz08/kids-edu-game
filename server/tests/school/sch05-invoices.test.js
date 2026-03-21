import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import { createRequire } from 'module';

// Set env vars before app load
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_KEY = '';

const { default: app } = await import('../../src/index.js');
const request = supertest(app);
const prisma = global.prisma;

const require = createRequire(import.meta.url);
const schoolBilling = require('../../src/routes/schoolBilling.js');
const stripe = schoolBilling.stripe;

const TEACHER_USER = {
  id: 'teacher-db-id',
  supabaseAuthId: 'mock-user-id',
  email: 'admin@school.com',
  role: 'teacher',
};

const SCHOOL_WITH_CUSTOMER = {
  id: 'school-001',
  name: 'Test School',
  contactEmail: 'admin@school.com',
  stripeCustomerId: 'cus_school_123',
  licenseStatus: 'active',
  seatCount: 5,
};

const SCHOOL_WITHOUT_CUSTOMER = {
  ...SCHOOL_WITH_CUSTOMER,
  stripeCustomerId: null,
};

const ADMIN_MEMBERSHIP_WITH_CUSTOMER = {
  id: 'st-001',
  userId: 'teacher-db-id',
  schoolId: 'school-001',
  role: 'admin',
  school: SCHOOL_WITH_CUSTOMER,
};

const ADMIN_MEMBERSHIP_WITHOUT_CUSTOMER = {
  ...ADMIN_MEMBERSHIP_WITH_CUSTOMER,
  school: SCHOOL_WITHOUT_CUSTOMER,
};

const MOCK_INVOICES = [
  {
    id: 'in_001',
    amount_paid: 29900,
    currency: 'usd',
    status: 'paid',
    invoice_pdf: 'https://stripe.com/invoice/in_001.pdf',
    period_start: 1700000000,
    period_end: 1702592000,
    created: 1700000000,
  },
  {
    id: 'in_002',
    amount_paid: 29900,
    currency: 'usd',
    status: 'paid',
    invoice_pdf: 'https://stripe.com/invoice/in_002.pdf',
    period_start: 1702592000,
    period_end: 1705270400,
    created: 1702592000,
  },
];

describe('SCH-05: School invoice listing', () => {
  let userFindUnique;
  let schoolTeacherFindUnique;
  let invoicesList;

  beforeEach(() => {
    userFindUnique = vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(TEACHER_USER);
    schoolTeacherFindUnique = vi.spyOn(prisma.schoolTeacher, 'findUnique').mockResolvedValue(ADMIN_MEMBERSHIP_WITH_CUSTOMER);
    invoicesList = vi.spyOn(stripe.invoices, 'list').mockResolvedValue({ data: MOCK_INVOICES });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/billing/school-invoices returns mapped invoices with invoicePdf field', async () => {
    const res = await request
      .get('/api/billing/school-invoices')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('invoices');
    expect(Array.isArray(res.body.invoices)).toBe(true);
    expect(res.body.invoices).toHaveLength(2);

    const first = res.body.invoices[0];
    expect(first).toHaveProperty('id', 'in_001');
    expect(first).toHaveProperty('amountPaid', 29900);
    expect(first).toHaveProperty('currency', 'usd');
    expect(first).toHaveProperty('status', 'paid');
    expect(first).toHaveProperty('invoicePdf', 'https://stripe.com/invoice/in_001.pdf');
    expect(first).toHaveProperty('periodStart');
    expect(first).toHaveProperty('periodEnd');
    expect(first).toHaveProperty('created');
  });

  it('GET /api/billing/school-invoices calls stripe.invoices.list with school.stripeCustomerId', async () => {
    await request
      .get('/api/billing/school-invoices')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(invoicesList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_school_123' })
    );
  });

  it('GET /api/billing/school-invoices returns empty array when school has no stripeCustomerId', async () => {
    schoolTeacherFindUnique.mockResolvedValue(ADMIN_MEMBERSHIP_WITHOUT_CUSTOMER);

    const res = await request
      .get('/api/billing/school-invoices')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ invoices: [] });
    expect(invoicesList).not.toHaveBeenCalled();
  });

  it('GET /api/billing/school-invoices returns 403 for non-admin', async () => {
    schoolTeacherFindUnique.mockResolvedValue({
      ...ADMIN_MEMBERSHIP_WITH_CUSTOMER,
      role: 'teacher', // not admin
    });

    const res = await request
      .get('/api/billing/school-invoices')
      .set('Authorization', 'Bearer supabase-mock-token');

    expect(res.status).toBe(403);
  });
});
