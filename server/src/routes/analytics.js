const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// GET /api/parent/analytics/parent/:childId — parent auth required
// Query params: period (default '7d')
router.get('/parent/:childId', async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { period = '7d' } = req.query;

    // Only Supabase (parent) users can call this endpoint
    if (!req.user || req.user.type === 'kid') {
      return res.status(403).json({ error: 'Parent authentication required' });
    }

    // Resolve parent's DB id from Supabase auth ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: req.user.id },
    });
    if (!dbUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Privacy check — ensure child belongs to requesting parent
    const kid = await prisma.kidProfile.findFirst({
      where: { id: childId, parentId: dbUser.id },
    });
    if (!kid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Compute cutoff date from period param
    const days = parsePeriodDays(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Fetch sessions and lesson progress in parallel
    const [sessions, progressRecords] = await Promise.all([
      prisma.session.findMany({
        where: { kidId: childId, startedAt: { gte: cutoffDate } },
      }),
      prisma.lessonProgress.findMany({
        where: { kidId: childId, updatedAt: { gte: cutoffDate } },
        include: { lesson: { include: { module: true } } },
      }),
    ]);

    // Build dailyMinutes array — one entry per day in the period
    const dailyMinutes = buildDailyMinutes(sessions, days);

    // Build moduleStars array — grouped by module slug
    const moduleStars = buildModuleStars(progressRecords);

    return res.json({ dailyMinutes, moduleStars });
  } catch (err) {
    next(err);
  }
});

// Parse period string like '7d', '30d' into number of days (default 7)
function parsePeriodDays(period) {
  const match = String(period).match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) : 7;
}

// Compute per-day minutes from sessions array
function buildDailyMinutes(sessions, days) {
  // Build map of YYYY-MM-DD → minutes
  const minuteMap = {};
  const today = new Date();

  // Pre-fill all days in range with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    minuteMap[key] = 0;
  }

  for (const session of sessions) {
    const start = new Date(session.startedAt);
    const end = session.endedAt
      ? new Date(session.endedAt)
      : new Date(session.lastHeartbeatAt);
    const durationMs = Math.max(0, end - start);
    const durationMinutes = durationMs / 60000;

    const dateKey = start.toISOString().slice(0, 10);
    if (Object.prototype.hasOwnProperty.call(minuteMap, dateKey)) {
      minuteMap[dateKey] += durationMinutes;
    }
  }

  return Object.entries(minuteMap).map(([date, minutes]) => ({
    date,
    minutes: Math.round(minutes),
  }));
}

// Group lesson progress by module and compute average stars
function buildModuleStars(progressRecords) {
  const moduleMap = {};

  for (const record of progressRecords) {
    const module = record.lesson?.module;
    if (!module) continue;

    const { slug, title } = module;
    if (!moduleMap[slug]) {
      moduleMap[slug] = { slug, name: title, totalStars: 0, count: 0 };
    }
    moduleMap[slug].totalStars += record.starsEarned || 0;
    moduleMap[slug].count += 1;
  }

  return Object.values(moduleMap).map(({ slug, name, totalStars, count }) => ({
    slug,
    name,
    avgStars: count > 0 ? Math.round((totalStars / count) * 10) / 10 : 0,
  }));
}

module.exports = router;
