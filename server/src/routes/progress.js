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

// POST /api/progress/:kidId/lesson/:lessonId
router.post('/:kidId/lesson/:lessonId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const record = await upsertProgress(kid.id, {
      lessonId: req.params.lessonId,
      ...req.body,
    });
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
