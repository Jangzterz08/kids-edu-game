import { describe, it } from 'vitest';

describe('SEC-01: Server-side price validation', () => {
  it.todo('POST /api/kids/:id/store/buy with price:0 deducts canonical price, not zero');
  it.todo('POST /api/kids/:id/store/buy with unknown itemId returns 400');
  it.todo('POST /api/kids/:id/store/buy without itemId returns 400');
  it.todo('POST /api/kids/:id/store/buy ignores client-supplied price field entirely');
});
