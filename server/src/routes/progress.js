const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');
const { upsertProgress } = require('../services/progressSync');

async function getParent(supabaseId) {
  return prisma.user.findUnique({ where: { supabaseAuthId: supabaseId } });
}

async function verifyKidOwnership(kidId, parentId) {
  const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
  if (!kid || kid.parentId !== parentId) return null;
  return kid;
}

// GET /api/progress/:kidId — aggregated progress per module
router.get('/:kidId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const modules = await prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          include: {
            progress: { where: { kidId: kid.id } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const result = modules.map(mod => {
      const total = mod.lessons.length;
      const completed = mod.lessons.filter(l => l.progress[0]?.starsEarned > 0).length;
      const totalStars = mod.lessons.reduce((sum, l) => sum + (l.progress[0]?.starsEarned ?? 0), 0);
      return {
        moduleSlug: mod.slug,
        title: mod.title,
        iconEmoji: mod.iconEmoji,
        lessonsTotal: total,
        lessonsCompleted: completed,
        starsEarned: totalStars,
        maxStars: total * 3,
      };
    });

    res.json({ progress: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/:kidId/stats — summary, accuracy, weekly activity, recommended
router.get('/:kidId/stats', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const allProgress = await prisma.lessonProgress.findMany({
      where: { kidId: kid.id },
      select: {
        matchScore: true, traceScore: true, quizScore: true,
        spellingScore: true, phonicsScore: true, patternScore: true, oddOneOutScore: true,
        starsEarned: true, updatedAt: true,
      },
    });

    const totalLessonsCompleted = allProgress.filter(p => p.starsEarned > 0).length;

    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
    const matchScores    = allProgress.filter(p => p.matchScore != null).map(p => p.matchScore);
    const traceScores    = allProgress.filter(p => p.traceScore != null).map(p => p.traceScore);
    const quizScores     = allProgress.filter(p => p.quizScore  != null).map(p => p.quizScore);
    const spellingScores = allProgress.filter(p => p.spellingScore != null).map(p => p.spellingScore);
    const phonicsScores  = allProgress.filter(p => p.phonicsScore != null).map(p => p.phonicsScore);
    const patternScores  = allProgress.filter(p => p.patternScore != null).map(p => p.patternScore);
    const oddOneOutScores = allProgress.filter(p => p.oddOneOutScore != null).map(p => p.oddOneOutScore);

    // Weekly activity — past 7 days by updatedAt
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      weekMap[key] = { day: dayNames[d.getDay()], count: 0 };
    }
    allProgress.forEach(p => {
      const key = new Date(p.updatedAt).toISOString().slice(0, 10);
      if (weekMap[key]) weekMap[key].count++;
    });
    const weeklyActivity = Object.values(weekMap);

    // Recommended: lowest-pct incomplete module
    const modules = await prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { lessons: { include: { progress: { where: { kidId: kid.id } } } } },
    });
    let recommended = null;
    let lowestPct = 1;
    for (const mod of modules) {
      const total = mod.lessons.length;
      if (total === 0) continue;
      const done = mod.lessons.filter(l => (l.progress[0]?.starsEarned ?? 0) > 0).length;
      const pct = done / total;
      if (pct < 1 && pct <= lowestPct) {
        lowestPct = pct;
        recommended = { slug: mod.slug, title: mod.title, iconEmoji: mod.iconEmoji, pct: Math.round(pct * 100) };
      }
    }

    res.json({
      summary: { totalStars: kid.totalStars, currentStreak: kid.currentStreak, totalLessonsCompleted },
      gameAccuracy: {
        match: avg(matchScores), trace: avg(traceScores), quiz: avg(quizScores),
        spelling: avg(spellingScores), phonics: avg(phonicsScores),
        pattern: avg(patternScores), oddOneOut: avg(oddOneOutScores),
      },
      weeklyActivity,
      recommended,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/progress/:kidId/module/:moduleSlug
router.get('/:kidId/module/:moduleSlug', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const module = await prisma.module.findUnique({ where: { slug: req.params.moduleSlug } });
    if (!module) return res.status(404).json({ error: 'Module not found' });

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: module.id },
      include: { progress: { where: { kidId: kid.id } } },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      lessons: lessons.map(l => ({
        ...l,
        progress: l.progress[0] || null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/:kidId/lesson/:lessonSlug
router.post('/:kidId/lesson/:lessonSlug', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    // Resolve slug → UUID (client sends slug, DB stores UUID)
    const lesson = await prisma.lesson.findFirst({ where: { slug: req.params.lessonSlug } });
    if (!lesson) return res.status(404).json({ error: `Lesson not found: ${req.params.lessonSlug}` });

    const record = await upsertProgress(kid.id, {
      lessonId: lesson.id,
      ...req.body,
    });

    // Update daily streak
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = kid.lastActivityDate ? new Date(kid.lastActivityDate) : null;
    if (last) last.setHours(0, 0, 0, 0);
    const diffDays = last ? Math.round((today - last) / 86400000) : null;
    if (diffDays !== 0) {
      const newStreak = diffDays === 1 ? kid.currentStreak + 1 : 1;
      await prisma.kidProfile.update({
        where: { id: kid.id },
        data: { currentStreak: newStreak, lastActivityDate: new Date() },
      });
    }

    res.json(record);
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/:kidId/sync — bulk offline sync
router.post('/:kidId/sync', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });

    let synced = 0;
    const errors = [];
    for (const entry of entries) {
      try {
        await upsertProgress(kid.id, entry);
        synced++;
      } catch (e) {
        errors.push({ lessonId: entry.lessonId, error: e.message });
      }
    }

    res.json({ synced, errors });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
