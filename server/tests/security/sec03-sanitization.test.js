import { describe, it, expect } from 'vitest';

// Set env vars before app load — db.js requires DATABASE_URL at module load time
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb?schema=kids_edu_game';
process.env.NODE_ENV = 'test';

// buildEmailHtml exported after implementation
const { buildEmailHtml } = await import('../../src/services/weeklyDigest.js');

function makeKidStats(overrides = {}) {
  return {
    kid: { name: 'TestKid', totalStars: 10, currentStreak: 3, coins: 50, ...overrides },
    lessonsThisWeek: 5,
    starsThisWeek: 8,
    recommended: { title: 'Alphabet', iconEmoji: '🔤', pct: 40 },
  };
}

describe('SEC-03: HTML entity escaping in email digests', () => {
  it('escapes <script> tags in kid.name', () => {
    const html = buildEmailHtml('Parent', [makeKidStats({ name: '<script>alert("xss")</script>' })]);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('escapes & in kid.name to &amp;', () => {
    const html = buildEmailHtml('Parent', [makeKidStats({ name: 'Emma & Luca' })]);
    expect(html).toContain('Emma &amp; Luca');
  });

  it('falls back to "Your child" when kid.name is undefined', () => {
    const html = buildEmailHtml('Parent', [makeKidStats({ name: undefined })]);
    expect(html).toContain('Your child');
    expect(html).not.toContain('undefined');
  });

  it('escapes parentName in greeting', () => {
    const html = buildEmailHtml('<b>Evil</b>', [makeKidStats()]);
    expect(html).toContain('&lt;b&gt;Evil&lt;/b&gt;');
    expect(html).not.toContain('<b>Evil</b>');
  });

  it('greeting says "Hi there" when parentName is null', () => {
    const html = buildEmailHtml(null, [makeKidStats()]);
    expect(html).toContain('Hi there');
  });
});
