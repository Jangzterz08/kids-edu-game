import { describe, it } from 'vitest';

describe('SEC-02: Rate limiting on kid auth endpoints', () => {
  it.todo('11th POST to /api/auth/kid-login within 60s returns 429');
  it.todo('11th POST to /api/auth/kid-lookup within 60s returns 429');
  it.todo('First 10 requests to /api/auth/kid-login succeed (not rate-limited)');
});
