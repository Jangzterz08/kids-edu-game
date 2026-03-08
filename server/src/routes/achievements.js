const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

async function getParent(supabaseId) {
  return prisma.user.findUnique({ where: { supabaseAuthId: supabaseId } });
}

async function verifyKidOwnership(kidId, parentId) {
  const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
  if (!kid || kid.parentId !== parentId) return null;
  return kid;
}

// GET /api/achievements/:kidId
router.get('/:kidId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const achievements = await prisma.achievement.findMany({
      where: { kidId: kid.id },
      orderBy: { earnedAt: 'desc' },
    });
    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

// POST /api/achievements/:kidId
router.post('/:kidId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { type, moduleSlug, label, iconEmoji } = req.body;
    if (!type || !label || !iconEmoji) {
      return res.status(400).json({ error: 'type, label and iconEmoji are required' });
    }

    // Use createOrIgnore pattern — @@unique prevents duplicates
    try {
      const achievement = await prisma.achievement.create({
        data: {
          kidId: kid.id,
          type,
          moduleSlug: moduleSlug || null,
          label,
          iconEmoji,
        },
      });
      res.status(201).json(achievement);
    } catch (e) {
      if (e.code === 'P2002') {
        // Already exists — return existing
        const existing = await prisma.achievement.findFirst({
          where: { kidId: kid.id, type, moduleSlug: moduleSlug || null },
        });
        res.json(existing);
      } else {
        throw e;
      }
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
