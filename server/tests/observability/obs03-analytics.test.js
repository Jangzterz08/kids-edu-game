import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.KID_JWT_SECRET = 'obs03-analytics-test-secret';
// SUPABASE_URL must be blank so auth middleware uses mock user path
process.env.SUPABASE_URL = '';

// Load the app — this triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);

// Access the real prisma instance (set by lib/db.js via global singleton)
const prisma = global.prisma;

const TEACHER_SUPABASE_ID = 'mock-user-id'; // matches auth middleware mock user id when SUPABASE_URL=''
const TEACHER_DB_ID = 'teacher-db-uuid';
const CLASSROOM_ID = 'classroom-uuid-1';
const OTHER_CLASSROOM_ID = 'other-classroom-uuid';

const MOCK_TEACHER_DB_USER = {
  id: TEACHER_DB_ID,
  supabaseAuthId: TEACHER_SUPABASE_ID,
  email: 'teacher@test.com',
  role: 'teacher',
};

const MOCK_CLASSROOM = {
  id: CLASSROOM_ID,
  teacherId: TEACHER_DB_ID,
  name: 'Class A',
};

const MOCK_CLASSROOM_STUDENTS = [
  {
    classroomId: CLASSROOM_ID,
    kid: { id: 'kid-1', name: 'Alice', avatarId: 'bear' },
  },
  {
    classroomId: CLASSROOM_ID,
    kid: { id: 'kid-2', name: 'Bob', avatarId: 'lion' },
  },
];

const MOCK_LESSON_PROGRESS = [
  {
    id: 'lp-1',
    kidId: 'kid-1',
    starsEarned: 3,
    attempts: 1,
    lesson: {
      id: 'lesson-1',
      module: { slug: 'animals', title: 'Animals' },
    },
  },
  {
    id: 'lp-2',
    kidId: 'kid-1',
    starsEarned: 1,
    attempts: 3,
    lesson: {
      id: 'lesson-2',
      module: { slug: 'animals', title: 'Animals' },
    },
  },
  {
    id: 'lp-3',
    kidId: 'kid-2',
    starsEarned: 2,
    attempts: 2,
    lesson: {
      id: 'lesson-1',
      module: { slug: 'animals', title: 'Animals' },
    },
  },
];

describe('OBS-03: Teacher classroom analytics', () => {
  let userFindUniqueSpy;
  let classroomFindFirstSpy;
  let classroomStudentFindManySpy;
  let lessonProgressFindManySpy;

  beforeEach(() => {
    userFindUniqueSpy = vi.spyOn(prisma.user, 'findUnique');
    classroomFindFirstSpy = vi.spyOn(prisma.classroom, 'findFirst');
    classroomStudentFindManySpy = vi.spyOn(prisma.classroomStudent, 'findMany');
    lessonProgressFindManySpy = vi.spyOn(prisma.lessonProgress, 'findMany');

    // Default: teacher user found
    userFindUniqueSpy.mockResolvedValue(MOCK_TEACHER_DB_USER);
    // Default: classroom owned by teacher
    classroomFindFirstSpy.mockResolvedValue(MOCK_CLASSROOM);
    // Default: students in classroom
    classroomStudentFindManySpy.mockResolvedValue(MOCK_CLASSROOM_STUDENTS);
    // Default: lesson progress for kids
    lessonProgressFindManySpy.mockResolvedValue(MOCK_LESSON_PROGRESS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/teacher/classroom/:id/analytics returns students, modules, and matrix arrays', async () => {
    const res = await request
      .get(`/api/teacher/classroom/${CLASSROOM_ID}/analytics`)
      .set('Authorization', 'Bearer mock-token')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(res.body).toHaveProperty('modules');
    expect(res.body).toHaveProperty('matrix');
    expect(Array.isArray(res.body.students)).toBe(true);
    expect(Array.isArray(res.body.modules)).toBe(true);
    expect(Array.isArray(res.body.matrix)).toBe(true);
    expect(res.body.students).toHaveLength(2);
    expect(res.body.modules.length).toBeGreaterThan(0);
  });

  it('Matrix entries have avgStars and attempts fields', async () => {
    const res = await request
      .get(`/api/teacher/classroom/${CLASSROOM_ID}/analytics`)
      .set('Authorization', 'Bearer mock-token')
      .send();

    expect(res.status).toBe(200);
    expect(res.body.matrix.length).toBeGreaterThan(0);
    res.body.matrix.forEach(entry => {
      expect(entry).toHaveProperty('studentId');
      expect(entry).toHaveProperty('moduleSlug');
      expect(entry).toHaveProperty('avgStars');
      expect(entry).toHaveProperty('attempts');
    });
  });

  it('GET /api/teacher/classroom/:id/analytics for non-owned classroom returns 403', async () => {
    // Override: classroom not found (not owned by this teacher)
    classroomFindFirstSpy.mockResolvedValue(null);

    const res = await request
      .get(`/api/teacher/classroom/${OTHER_CLASSROOM_ID}/analytics`)
      .set('Authorization', 'Bearer mock-token')
      .send();

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Access denied');
  });

  it('GET /api/teacher/classroom/:id/analytics without auth returns 401', async () => {
    const res = await request
      .get(`/api/teacher/classroom/${CLASSROOM_ID}/analytics`)
      .send();

    expect(res.status).toBe(401);
  });
});
