const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');
const { upsertProgress } = require('../services/progressSync');
const { FREE_MODULE_SLUGS, isParentPremium } = require('../lib/subscriptionUtils');
const { sendUpgradeNudge } = require('../services/upgradeNudge');
const { getKidSchoolLicense } = require('../lib/schoolUtils');

// Multi-role kid access: kid JWT (own data), parent (own kids), teacher (enrolled students)
async function resolveKidAccess(req, kidId) {
  // Kid JWT — can only access own data
  if (req.user.type === 'kid') {
    if (req.user.id !== kidId) return null;
    return prisma.kidProfile.findUnique({ where: { id: kidId } });
  }

  // Supabase user — parent or teacher
  const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
  if (!dbUser) return null;

  if (dbUser.role === 'parent') {
    const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
    return kid?.parentId === dbUser.id ? kid : null;
  }

  if (dbUser.role === 'teacher') {
    // Teacher can view kids enrolled in their classrooms
    const enrollment = await prisma.classroomStudent.findFirst({
      where: { kidId, classroom: { teacherId: dbUser.id } },
    });
    return enrollment ? prisma.kidProfile.findUnique({ where: { id: kidId } }) : null;
  }

  return null;
}

// Write access — only parent who owns the kid, or the kid themselves
async function resolveWriteAccess(req, kidId) {
  if (req.user.type === 'kid') {
    if (req.user.id !== kidId) return null;
    return prisma.kidProfile.findUnique({ where: { id: kidId } });
  }

  const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
  if (!dbUser) return null;

  const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
  return kid?.parentId === dbUser.id ? kid : null;
}

// GET /api/progress/:kidId — aggregated progress per module
router.get('/:kidId', async (req, res, next) => {
  try {
    const kid = await resolveKidAccess(req, req.params.kidId);
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
    const kid = await resolveKidAccess(req, req.params.kidId);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const [allProgress, modules] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { kidId: kid.id },
        select: {
          matchScore: true, traceScore: true, quizScore: true,
          spellingScore: true, phonicsScore: true, patternScore: true, oddOneOutScore: true,
          starsEarned: true, updatedAt: true,
        },
      }),
      prisma.module.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { lessons: { include: { progress: { where: { kidId: kid.id } } } } },
      }),
    ]);

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
    const kid = await resolveKidAccess(req, req.params.kidId);
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

// POST /api/progress/:kidId/lesson/:lessonSlug — write access (parent or kid themselves)
router.post('/:kidId/lesson/:lessonSlug', async (req, res, next) => {
  try {
    const kid = await resolveWriteAccess(req, req.params.kidId);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    // Resolve slug → UUID (client sends slug, DB stores UUID)
    const lesson = await prisma.lesson.findFirst({
      where: { slug: req.params.lessonSlug },
      include: { module: true },
    });
    if (!lesson) return res.status(404).json({ error: `Lesson not found: ${req.params.lessonSlug}` });

    // Module gating — reject progress for locked modules when parent is not premium
    if (lesson.module && !FREE_MODULE_SLUGS.includes(lesson.module.slug)) {
      const parent = await prisma.user.findUnique({
        where: { id: kid.parentId },
        select: { subscriptionStatus: true, trialEndsAt: true },
      });
      if (!isParentPremium(parent)) {
        // Check school license bypass before rejecting
        const schoolLicense = await getKidSchoolLicense(kid.id);
        if (!schoolLicense) {
          // Fire-and-forget email nudge — do not await, do not block 403 response
          sendUpgradeNudge(kid.parentId).catch(err => console.error('[nudge] Error:', err.message));
          return res.status(403).json({ error: 'Premium subscription required for this module' });
        }
        // School license found — allow through
      }
    }

    const {
      viewed,
      matchScore, traceScore, quizScore, spellingScore,
      phonicsScore, patternScore, oddOneOutScore, scrambleScore,
      sortScore, trueFalseScore, memoryMatchScore,
    } = req.body;

    const record = await upsertProgress(kid.id, {
      lessonId: lesson.id,
      viewed,
      matchScore, traceScore, quizScore, spellingScore,
      phonicsScore, patternScore, oddOneOutScore, scrambleScore,
      sortScore, trueFalseScore, memoryMatchScore,
      moduleSlug: lesson.module.slug,
    }, kid.ageGroup);

    // Read updated streak from kid profile (upsertProgress already updated it)
    const updatedKid = await prisma.kidProfile.findUnique({
      where: { id: kid.id },
      select: { currentStreak: true },
    });

    res.json({ ...record, streakCount: updatedKid?.currentStreak ?? 1 });
  } catch (err) {
    next(err);
  }
});

// POST /api/progress/:kidId/sync — bulk offline sync (write access)
router.post('/:kidId/sync', async (req, res, next) => {
  try {
    const kid = await resolveWriteAccess(req, req.params.kidId);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).json({ error: 'entries must be an array' });

    let synced = 0;
    const errors = [];
    for (const entry of entries) {
      try {
        await upsertProgress(kid.id, entry, kid.ageGroup);
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
