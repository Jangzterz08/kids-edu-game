import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.KID_JWT_SECRET = 'obs02-analytics-test-secret';
// SUPABASE_URL must be blank so auth middleware uses mock user path
process.env.SUPABASE_URL = '';

// Load the app — this triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);

// Access the real prisma instance (set by lib/db.js via global singleton)
const prisma = global.prisma;

const PARENT_SUPABASE_ID = 'mock-user-id'; // matches auth middleware mock user id when SUPABASE_URL=''
const PARENT_DB_ID = 'parent-db-uuid';
const CHILD_ID = 'child-profile-uuid';
const OTHER_CHILD_ID = 'other-child-uuid';

const MOCK_PARENT_DB_USER = {
  id: PARENT_DB_ID,
  supabaseAuthId: PARENT_SUPABASE_ID,
  email: 'parent@test.com',
  role: 'parent',
};

const MOCK_KID = {
  id: CHILD_ID,
  parentId: PARENT_DB_ID,
  name: 'Test Kid',
};

const now = new Date();
const startedAt = new Date(now.getTime() - 30 * 60000); // 30 minutes ago

const MOCK_SESSIONS = [
  {
    id: 'sess-1',
    kidId: CHILD_ID,
    startedAt,
    endedAt: now,
    lastHeartbeatAt: now,
  },
];

const MOCK_LESSON_PROGRESS = [
  {
    id: 'lp-1',
    kidId: CHILD_ID,
    starsEarned: 2,
    updatedAt: now,
    lesson: {
      id: 'lesson-1',
      module: {
        id: 'module-1',
        slug: 'animals',
        title: 'Animals',
      },
    },
  },
  {
    id: 'lp-2',
    kidId: CHILD_ID,
    starsEarned: 3,
    updatedAt: now,
    lesson: {
      id: 'lesson-2',
      module: {
        id: 'module-1',
        slug: 'animals',
        title: 'Animals',
      },
    },
  },
];

describe('OBS-02: Parent analytics', () => {
  let userFindUniqueSpy;
  let kidProfileFindFirstSpy;
  let sessionFindManySpy;
  let lessonProgressFindManySpy;

  beforeEach(() => {
    userFindUniqueSpy = vi.spyOn(prisma.user, 'findUnique');
    kidProfileFindFirstSpy = vi.spyOn(prisma.kidProfile, 'findFirst');
    sessionFindManySpy = vi.spyOn(prisma.session, 'findMany');
    lessonProgressFindManySpy = vi.spyOn(prisma.lessonProgress, 'findMany');

    // Default: user found
    userFindUniqueSpy.mockResolvedValue(MOCK_PARENT_DB_USER);
    // Default: kid owned by parent
    kidProfileFindFirstSpy.mockResolvedValue(MOCK_KID);
    // Default: some sessions
    sessionFindManySpy.mockResolvedValue(MOCK_SESSIONS);
    // Default: some lesson progress
    lessonProgressFindManySpy.mockResolvedValue(MOCK_LESSON_PROGRESS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/parent/analytics/parent/:childId returns dailyMinutes and moduleStars arrays', async () => {
    const res = await request
      .get(`/api/parent/analytics/parent/${CHILD_ID}`)
      .set('Authorization', 'Bearer mock-token')
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dailyMinutes');
    expect(res.body).toHaveProperty('moduleStars');
    expect(Array.isArray(res.body.dailyMinutes)).toBe(true);
    expect(Array.isArray(res.body.moduleStars)).toBe(true);

    // dailyMinutes should have 7 entries (default 7d period)
    expect(res.body.dailyMinutes).toHaveLength(7);
    res.body.dailyMinutes.forEach(entry => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('minutes');
    });

    // moduleStars should aggregate across module
    expect(res.body.moduleStars.length).toBeGreaterThan(0);
    const animalsStat = res.body.moduleStars.find(m => m.slug === 'animals');
    expect(animalsStat).toBeDefined();
    expect(animalsStat).toHaveProperty('avgStars');
    // (2+3)/2 = 2.5
    expect(animalsStat.avgStars).toBe(2.5);
  });

  it('GET /api/parent/analytics/parent/:childId for non-owned child returns 403', async () => {
    // Override: kid not found (not owned by this parent)
    kidProfileFindFirstSpy.mockResolvedValue(null);

    const res = await request
      .get(`/api/parent/analytics/parent/${OTHER_CHILD_ID}`)
      .set('Authorization', 'Bearer mock-token')
      .send();

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Access denied');
  });

  it('GET /api/parent/analytics/parent/:childId without auth returns 401', async () => {
    const res = await request
      .get(`/api/parent/analytics/parent/${CHILD_ID}`)
      .send();

    expect(res.status).toBe(401);
  });
});
