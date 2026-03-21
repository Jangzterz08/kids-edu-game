import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';

// Set env vars before app load — dotenv won't override pre-set vars
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
const TEST_KID_SECRET = 'obs02-sessions-test-secret';
process.env.KID_JWT_SECRET = TEST_KID_SECRET;

// Load the app — this triggers CJS require chain and sets global.prisma
const { default: app } = await import('../../src/index.js');
const request = supertest(app);

// Access the real prisma instance (set by lib/db.js via global singleton)
const prisma = global.prisma;

const KID_ID = 'kid-session-test-id';
const kidToken = jwt.sign({ sub: KID_ID, type: 'kid' }, TEST_KID_SECRET, { expiresIn: '1h' });

const MOCK_SESSION = {
  id: 'session-abc-123',
  kidId: KID_ID,
  startedAt: new Date(),
  endedAt: null,
  lastHeartbeatAt: new Date(),
};

describe('OBS-02: Session heartbeat', () => {
  let sessionCreateSpy;
  let sessionUpdateManySpy;

  beforeEach(() => {
    sessionCreateSpy = vi.spyOn(prisma.session, 'create');
    sessionUpdateManySpy = vi.spyOn(prisma.session, 'updateMany');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/sessions/heartbeat without sessionId creates a new session', async () => {
    sessionCreateSpy.mockResolvedValue(MOCK_SESSION);

    const res = await request
      .post('/api/sessions/heartbeat')
      .set('Authorization', `Bearer ${kidToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionId', MOCK_SESSION.id);
    expect(sessionCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kidId: KID_ID }) })
    );
  });

  it('POST /api/sessions/heartbeat with sessionId updates lastHeartbeatAt', async () => {
    const existingSessionId = 'existing-session-id';
    // updateMany returns count > 0 meaning the session was found
    sessionUpdateManySpy.mockResolvedValue({ count: 1 });

    const res = await request
      .post('/api/sessions/heartbeat')
      .set('Authorization', `Bearer ${kidToken}`)
      .send({ sessionId: existingSessionId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionId', existingSessionId);
    expect(sessionUpdateManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: existingSessionId, kidId: KID_ID }),
        data: expect.objectContaining({ lastHeartbeatAt: expect.any(Date) }),
      })
    );
  });

  it('POST /api/sessions/heartbeat without auth returns 401', async () => {
    const res = await request
      .post('/api/sessions/heartbeat')
      .send({});

    expect(res.status).toBe(401);
  });
});
