import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';

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

const ADMIN_USER = {
  id: 'admin-user-id',
  supabaseAuthId: 'mock-user-id',
  email: 'admin@school.com',
  role: 'teacher',
};

const SCHOOL = {
  id: 'school-001',
  name: 'Test School',
  contactEmail: 'admin@school.com',
  stripeCustomerId: 'cus_school_123',
  licenseStatus: 'active',
  seatCount: 5,
};

const ADMIN_MEMBERSHIP = {
  id: 'st-admin-001',
  userId: 'admin-user-id',
  schoolId: 'school-001',
  role: 'admin',
  school: SCHOOL,
};

const TARGET_TEACHER = {
  id: 'target-teacher-id',
  email: 'teacher@school.com',
  role: 'teacher',
};

describe('SCH-03: Seat cap enforcement', () => {
  let userFindUnique;
  let schoolTeacherFindUnique;

  beforeEach(() => {
    // Default: admin user lookup
    userFindUnique = vi.spyOn(prisma.user, 'findUnique')
      .mockImplementation(({ where }) => {
        if (where.supabaseAuthId === 'mock-user-id') return Promise.resolve(ADMIN_USER);
        if (where.email === 'teacher@school.com') return Promise.resolve(TARGET_TEACHER);
        return Promise.resolve(null);
      });

    // Default: admin membership
    schoolTeacherFindUnique = vi.spyOn(prisma.schoolTeacher, 'findUnique')
      .mockImplementation(({ where }) => {
        if (where.userId === 'admin-user-id') return Promise.resolve(ADMIN_MEMBERSHIP);
        // target teacher has no existing school membership
        if (where.userId === 'target-teacher-id') return Promise.resolve(null);
        return Promise.resolve(null);
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/school/teachers adds teacher when seat is available (returns 201)', async () => {
    // Transaction mock: count returns 4 (below seatCount 5), create succeeds
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => {
      return fn({
        schoolTeacher: {
          count: vi.fn().mockResolvedValue(4),
          create: vi.fn().mockResolvedValue({
            id: 'st-new-001',
            schoolId: 'school-001',
            userId: 'target-teacher-id',
            role: 'teacher',
          }),
        },
      });
    });

    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ email: 'teacher@school.com' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('teacher');
  });

  it('POST /api/school/teachers returns 403 with "Seat limit reached" when seat cap reached', async () => {
    // Transaction mock: count returns 5 (= seatCount 5), throws SEAT_CAP_REACHED
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => {
      return fn({
        schoolTeacher: {
          count: vi.fn().mockResolvedValue(5),
          create: vi.fn(),
        },
      });
    });

    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ email: 'teacher@school.com' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Seat limit reached/);
    expect(res.body.error).toMatch(/5 seats/);
  });

  it('POST /api/school/teachers returns 404 when email not found', async () => {
    userFindUnique.mockImplementation(({ where }) => {
      if (where.supabaseAuthId === 'mock-user-id') return Promise.resolve(ADMIN_USER);
      return Promise.resolve(null); // email not found
    });

    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ email: 'nonexistent@school.com' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/school/teachers returns 400 when user is not a teacher account', async () => {
    userFindUnique.mockImplementation(({ where }) => {
      if (where.supabaseAuthId === 'mock-user-id') return Promise.resolve(ADMIN_USER);
      // found user but they are a parent, not a teacher
      if (where.email === 'parent@example.com') return Promise.resolve({ id: 'parent-id', email: 'parent@example.com', role: 'parent' });
      return Promise.resolve(null);
    });

    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ email: 'parent@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a teacher/);
  });

  it('POST /api/school/teachers returns 409 when teacher already belongs to a school', async () => {
    schoolTeacherFindUnique.mockImplementation(({ where }) => {
      if (where.userId === 'admin-user-id') return Promise.resolve(ADMIN_MEMBERSHIP);
      // target teacher already has a school membership
      if (where.userId === 'target-teacher-id') return Promise.resolve({
        id: 'st-existing',
        userId: 'target-teacher-id',
        schoolId: 'other-school-id',
        role: 'teacher',
      });
      return Promise.resolve(null);
    });

    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({ email: 'teacher@school.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already belongs/);
  });

  it('POST /api/school/teachers returns 400 when email is missing', async () => {
    const res = await request
      .post('/api/school/teachers')
      .set('Authorization', 'Bearer supabase-mock-token')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('email is required');
  });
});
