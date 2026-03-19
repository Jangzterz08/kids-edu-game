import { describe, it } from 'vitest';

describe('SEC-04: Production startup guard', () => {
  it.todo('throws when NODE_ENV=production and SUPABASE_URL is missing');
  it.todo('throws when NODE_ENV=production and SUPABASE_SERVICE_KEY is missing');
  it.todo('does NOT throw when NODE_ENV=test');
  it.todo('does NOT throw when NODE_ENV is undefined');
});
