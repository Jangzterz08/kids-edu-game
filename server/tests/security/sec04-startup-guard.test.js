import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

describe('SEC-04: Production startup guard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  });

  it('throws when NODE_ENV=production and SUPABASE_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_KEY = 'test-key';
    expect(() => require('../../src/middleware/auth')).toThrow('SUPABASE_URL');
  });

  it('throws when NODE_ENV=production and SUPABASE_SERVICE_KEY is missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    delete process.env.SUPABASE_SERVICE_KEY;
    expect(() => require('../../src/middleware/auth')).toThrow('SUPABASE_SERVICE_KEY');
  });

  it('does NOT throw when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    expect(() => require('../../src/middleware/auth')).not.toThrow();
  });

  it('does NOT throw when NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    expect(() => require('../../src/middleware/auth')).not.toThrow();
  });
});
