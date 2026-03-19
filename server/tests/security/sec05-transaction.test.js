import { describe, it } from 'vitest';

describe('SEC-05: Prisma transaction for coin purchase', () => {
  it.todo('concurrent buy requests for same item result in exactly one unlock');
  it.todo('coins are decremented by canonical price inside transaction');
  it.todo('malformed unlockedItems JSON falls back to empty array');
});
