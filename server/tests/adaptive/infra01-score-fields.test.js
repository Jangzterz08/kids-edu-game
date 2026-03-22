import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

// Set env before any require() calls so db.js does not throw on invalid URL
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';
process.env.KID_JWT_SECRET = 'infra01-test-secret';

const require = createRequire(import.meta.url);
const { computeStars, SCORE_FIELDS } = require('../../src/services/progressSync');

// ---------------------------------------------------------------------------
// SCORE_FIELDS registry — must contain 11 entries (8 existing + 3 new)
// ---------------------------------------------------------------------------

describe('SCORE_FIELDS registry', () => {
  it('contains exactly 11 entries including all 3 new game types', () => {
    expect(Array.isArray(SCORE_FIELDS)).toBe(true);
    expect(SCORE_FIELDS).toHaveLength(11);
    // Existing 8
    expect(SCORE_FIELDS).toContain('matchScore');
    expect(SCORE_FIELDS).toContain('traceScore');
    expect(SCORE_FIELDS).toContain('quizScore');
    expect(SCORE_FIELDS).toContain('spellingScore');
    expect(SCORE_FIELDS).toContain('phonicsScore');
    expect(SCORE_FIELDS).toContain('patternScore');
    expect(SCORE_FIELDS).toContain('oddOneOutScore');
    expect(SCORE_FIELDS).toContain('scrambleScore');
    // New 3
    expect(SCORE_FIELDS).toContain('sortScore');
    expect(SCORE_FIELDS).toContain('trueFalseScore');
    expect(SCORE_FIELDS).toContain('memoryMatchScore');
  });
});

// ---------------------------------------------------------------------------
// computeStars with new game types
// ---------------------------------------------------------------------------

describe('computeStars with new game types', () => {
  it('returns 3 when sortScore and trueFalseScore are both >= 80', () => {
    const entry = { viewed: true, sortScore: 90, trueFalseScore: 85 };
    expect(computeStars(entry)).toBe(3);
  });

  it('returns 2 when only memoryMatchScore is present and >= 60', () => {
    // Single score >= 60 but count < 2, so cannot be 3 stars
    const entry = { viewed: true, memoryMatchScore: 70 };
    expect(computeStars(entry)).toBe(2);
  });

  it('returns 1 when sortScore is below 60', () => {
    const entry = { viewed: true, sortScore: 40 };
    expect(computeStars(entry)).toBe(1);
  });

  it('returns 3 when mixed old and new fields all pass (>= 80, count >= 2)', () => {
    const entry = { viewed: true, sortScore: 95, matchScore: 85, trueFalseScore: 80 };
    expect(computeStars(entry)).toBe(3);
  });

  it('returns 0 when not viewed', () => {
    const entry = { viewed: false, sortScore: 95, trueFalseScore: 90 };
    expect(computeStars(entry)).toBe(0);
  });
});
