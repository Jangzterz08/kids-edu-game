const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');
const { getChallengeSlug, todayDate } = require('../lib/dailyChallengeUtils');
const { isParentPremium } = require('../lib/subscriptionUtils');
const { getKidSchoolLicense } = require('../lib/schoolUtils');
const { SCORE_FIELDS } = require('../services/progressSync');

const STORE_ITEMS = {
  frog:      { price: 30  },
  chick:     { price: 40  },
  hamster:   { price: 60  },
  panda:     { price: 80  },
  butterfly: { price: 100 },
  dragon:    { price: 120 },
  dino:      { price: 150 },
  unicorn:   { price: 200 },
};

async function getParent(supabaseId) {
  return prisma.user.findUnique({ where: { supabaseAuthId: supabaseId } });
}

async function verifyKidOwnership(kidId, parentId) {
  const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
  if (!kid || kid.parentId !== parentId) return null;
  return kid;
}

// Multi-role kid access: kid JWT (own data), parent (own kids), teacher (enrolled students)
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

// GET /api/kids
router.get('/', async (req, res, next) => {
  try {
    // Kid JWT — return just themselves
    if (req.user.type === 'kid') {
      const kid = await prisma.kidProfile.findUnique({ where: { id: req.user.id } });
      return res.json({ kids: kid ? [kid] : [] });
    }

    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });

    const kids = await prisma.kidProfile.findMany({
      where: { parentId: parent.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ kids });
  } catch (err) {
    next(err);
  }
});

// POST /api/kids
router.post('/', async (req, res, next) => {
  try {
    const { name, avatarId, ageGroup } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const parent = await getParent(req.user.id);
    if (!parent) {
      // Auto-create parent row if not yet registered
      await prisma.user.upsert({
        where: { supabaseAuthId: req.user.id },
        create: { supabaseAuthId: req.user.id, email: req.user.email },
        update: { email: req.user.email },
      });
    }
    const resolvedParent = parent || await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });

    const kid = await prisma.kidProfile.create({
      data: {
        parentId: resolvedParent.id,
        name,
        avatarId: avatarId || 'bear',
        ageGroup: ageGroup || null,
      },
    });
    res.status(201).json(kid);
  } catch (err) {
    next(err);
  }
});

// GET /api/kids/:kidId/home-summary — aggregated KidHome data (single request replacing 5)
router.get('/:kidId/home-summary', async (req, res, next) => {
  try {
    const kid = await resolveKidAccess(req, req.params.kidId);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const today = todayDate();

    const [modules, achievements, enrollments, dailyChallenge, parentUser, difficultyRows, dueSchedules] = await Promise.all([
      prisma.module.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          lessons: {
            include: { progress: { where: { kidId: kid.id } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.achievement.findMany({
        where: { kidId: kid.id },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.classroomStudent.findMany({
        where: { kidId: kid.id },
        include: { classroom: { select: { id: true, name: true } } },
      }),
      prisma.dailyChallenge.findUnique({
        where: { kidId_date: { kidId: kid.id, date: today } },
      }),
      prisma.user.findUnique({
        where: { id: kid.parentId },
        select: { subscriptionStatus: true, trialEndsAt: true, subscriptionEnd: true },
      }),
      prisma.moduleDifficulty.findMany({
        where: { kidId: kid.id },
      }),
      prisma.reviewSchedule.findMany({
        where: { kidId: kid.id, dueDate: { lte: new Date() } },
        include: {
          lesson: {
            include: {
              module: { select: { slug: true, title: true, iconEmoji: true } },
              progress: { where: { kidId: kid.id }, take: 1 },
            },
          },
        },
      }),
    ]);

    const progress = modules.map(mod => ({
      moduleSlug: mod.slug,
      title: mod.title,
      iconEmoji: mod.iconEmoji,
      lessonsTotal: mod.lessons.length,
      lessonsCompleted: mod.lessons.filter(l => l.progress[0]?.starsEarned > 0).length,
      starsEarned: mod.lessons.reduce((sum, l) => sum + (l.progress[0]?.starsEarned ?? 0), 0),
      maxStars: mod.lessons.length * 3,
    }));

    // Recommendations: medium-band modules, fill with untried, cap at 3
    const mediumSlugs = new Set(difficultyRows.filter(d => d.level === 'medium').map(d => d.moduleSlug));
    const startedSlugs = new Set(modules.filter(m => m.lessons.some(l => l.progress.length > 0)).map(m => m.slug));

    let recommendations = modules
      .filter(m => mediumSlugs.has(m.slug))
      .slice(0, 3)
      .map(m => ({ moduleSlug: m.slug, title: m.title, iconEmoji: m.iconEmoji }));

    if (recommendations.length < 3) {
      const untried = modules
        .filter(m => !startedSlugs.has(m.slug) && !mediumSlugs.has(m.slug))
        .slice(0, 3 - recommendations.length)
        .map(m => ({ moduleSlug: m.slug, title: m.title, iconEmoji: m.iconEmoji }));
      recommendations = [...recommendations, ...untried];
    }

    // Review Today: due lessons sorted by lowest accuracy, cap at 3
    const reviewToday = dueSchedules
      .map(rs => {
        const prog = rs.lesson.progress[0];
        const scores = SCORE_FIELDS.map(f => prog?.[f]).filter(s => s != null);
        const accuracy = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return {
          lessonId: rs.lessonId,
          lessonSlug: rs.lesson.slug,
          lessonTitle: rs.lesson.title,
          moduleSlug: rs.lesson.module.slug,
          moduleTitle: rs.lesson.module.title,
          moduleIconEmoji: rs.lesson.module.iconEmoji,
          accuracy,
          dueDate: rs.dueDate,
          lastReviewedAt: rs.lastReviewedAt,
        };
      })
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
        const aDate = a.lastReviewedAt ? new Date(a.lastReviewedAt) : new Date(0);
        const bDate = b.lastReviewedAt ? new Date(b.lastReviewedAt) : new Date(0);
        return aDate - bDate;
      })
      .slice(0, 3)
      .map(({ lastReviewedAt, ...item }) => item); // strip internal sort field

    let isPremium = isParentPremium(parentUser);
    if (!isPremium) {
      const schoolLicense = await getKidSchoolLicense(kid.id);
      if (schoolLicense) isPremium = true;
    }

    res.json({
      kid: {
        id: kid.id,
        name: kid.name,
        avatarId: kid.avatarId,
        totalStars: kid.totalStars,
        currentStreak: kid.currentStreak,
        coins: kid.coins,
      },
      progress,
      achievements,
      classrooms: enrollments.map(e => e.classroom),
      dailyChallenge: {
        moduleSlug: getChallengeSlug(),
        completedAt: dailyChallenge?.completedAt || null,
        coinsEarned: dailyChallenge?.coinsEarned || 0,
      },
      isPremium,
      subscription: parentUser ? {
        status: parentUser.subscriptionStatus,
        trialEndsAt: parentUser.trialEndsAt,
        subscriptionEnd: parentUser.subscriptionEnd,
      } : null,
      recommendations,
      reviewToday,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/kids/:kidId
router.put('/:kidId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });

    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { name, avatarId, ageGroup } = req.body;
    const updated = await prisma.kidProfile.update({
      where: { id: kid.id },
      data: {
        ...(name && { name }),
        ...(avatarId && { avatarId }),
        ...(ageGroup !== undefined && { ageGroup }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/kids/:kidId/store/buy
router.post('/:kidId/store/buy', async (req, res, next) => {
  try {
    let kid;
    if (req.user.type === 'kid') {
      if (req.user.id !== req.params.kidId) return res.status(403).json({ error: 'Forbidden' });
      kid = await prisma.kidProfile.findUnique({ where: { id: req.user.id } });
    } else {
      const parent = await getParent(req.user.id);
      if (!parent) return res.status(404).json({ error: 'Parent account not found' });
      kid = await verifyKidOwnership(req.params.kidId, parent.id);
    }
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { itemId } = req.body;
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });
    const item = STORE_ITEMS[itemId];
    if (!item) return res.status(400).json({ error: 'Unknown item' });
    const price = item.price;

    const updated = await prisma.$transaction(async (tx) => {
      const freshKid = await tx.kidProfile.findUnique({ where: { id: kid.id } });
      if (!freshKid) throw Object.assign(new Error('Kid not found'), { status: 404 });

      const unlocked = (() => {
        try { return JSON.parse(freshKid.unlockedItems || '[]'); }
        catch { return []; }
      })();

      if (unlocked.includes(itemId)) throw Object.assign(new Error('Already unlocked'), { status: 400 });
      if (freshKid.coins < price) throw Object.assign(new Error('Not enough coins'), { status: 400 });

      return tx.kidProfile.update({
        where: { id: freshKid.id },
        data: {
          coins: { decrement: price },
          unlockedItems: JSON.stringify([...unlocked, itemId]),
        },
      });
    });

    res.json({ coins: updated.coins, unlockedItems: JSON.parse(updated.unlockedItems || '[]') });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

// DELETE /api/kids/:kidId
router.delete('/:kidId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });

    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    await prisma.kidProfile.delete({ where: { id: kid.id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Classroom endpoints ---

// GET /api/kids/me/classrooms — kid's own classrooms (kid JWT auth)
router.get('/me/classrooms', async (req, res, next) => {
  try {
    if (req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Kid auth required' });
    }
    const enrollments = await prisma.classroomStudent.findMany({
      where: { kidId: req.user.id },
      include: { classroom: { select: { id: true, name: true } } },
    });
    res.json({ classrooms: enrollments.map(e => e.classroom) });
  } catch (err) { next(err); }
});

// GET /api/kids/:kidId/classrooms — parent views kid's classrooms
router.get('/:kidId/classrooms', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const enrollments = await prisma.classroomStudent.findMany({
      where: { kidId: kid.id },
      include: {
        classroom: {
          select: { id: true, name: true, teacher: { select: { name: true } } },
        },
      },
    });
    res.json({ classrooms: enrollments.map(e => e.classroom) });
  } catch (err) { next(err); }
});

// POST /api/kids/:kidId/join-classroom — parent enrolls kid via join code
router.post('/:kidId/join-classroom', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { joinCode } = req.body;
    if (!joinCode) return res.status(400).json({ error: 'joinCode is required' });

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      select: { id: true, name: true, teacher: { select: { name: true } } },
    });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found. Check the code and try again.' });

    // Check if already enrolled
    const existing = await prisma.classroomStudent.findUnique({
      where: { classroomId_kidId: { classroomId: classroom.id, kidId: kid.id } },
    });
    if (existing) return res.status(400).json({ error: 'Already enrolled in this classroom' });

    await prisma.classroomStudent.create({
      data: { classroomId: classroom.id, kidId: kid.id },
    });

    res.json({ classroom });
  } catch (err) { next(err); }
});

// DELETE /api/kids/:kidId/leave-classroom/:classroomId — parent removes kid from classroom
router.delete('/:kidId/leave-classroom/:classroomId', async (req, res, next) => {
  try {
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    await prisma.classroomStudent.delete({
      where: { classroomId_kidId: { classroomId: req.params.classroomId, kidId: kid.id } },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
