const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// Multi-role kid access
async function resolveKidAccess(req, kidId) {
  if (req.user.type === 'kid') {
    if (req.user.id !== kidId) return null;
    return prisma.kidProfile.findUnique({ where: { id: kidId } });
  }
  const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
  if (!dbUser) return null;
  if (dbUser.role === 'parent') {
    const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
    return kid?.parentId === dbUser.id ? kid : null;
  }
  if (dbUser.role === 'teacher') {
    const enrollment = await prisma.classroomStudent.findFirst({
      where: { kidId, classroom: { teacherId: dbUser.id } },
    });
    return enrollment ? prisma.kidProfile.findUnique({ where: { id: kidId } }) : null;
  }
  return null;
}

// Write access — parent or kid themselves
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

// GET /api/achievements/:kidId
router.get('/:kidId', async (req, res, next) => {
  try {
    const kid = await resolveKidAccess(req, req.params.kidId);
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
    const kid = await resolveWriteAccess(req, req.params.kidId);
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
