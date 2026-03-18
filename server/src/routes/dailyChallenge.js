const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

const DAILY_SLUGS = [
  'logic', 'alphabet', 'numbers', 'shapes', 'colors',
  'animals', 'body-parts', 'manners', 'household',
  'food-pyramid', 'emotions', 'weather', 'days-of-week',
];
const BONUS_COINS = 20;

function todayDate() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getChallengeSlug() {
  const start = new Date(new Date().getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_SLUGS[dayOfYear % DAILY_SLUGS.length];
}

// GET /api/daily-challenge/:kidId — returns today's challenge + completion status
router.get('/:kidId', async (req, res, next) => {
  try {
    const { kidId } = req.params;
    if (req.user.type === 'kid' && req.user.id !== kidId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const moduleSlug = getChallengeSlug();
    const today = todayDate();

    const existing = await prisma.dailyChallenge.findUnique({
      where: { kidId_date: { kidId, date: today } },
    });

    res.json({
      moduleSlug,
      completedAt: existing?.completedAt || null,
      coinsEarned: existing?.coinsEarned || 0,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/daily-challenge/:kidId/complete — marks done, awards bonus coins
router.post('/:kidId/complete', async (req, res, next) => {
  try {
    const { kidId } = req.params;
    if (req.user.type === 'kid' && req.user.id !== kidId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const moduleSlug = getChallengeSlug();
    const today = todayDate();

    const existing = await prisma.dailyChallenge.findUnique({
      where: { kidId_date: { kidId, date: today } },
    });

    if (existing?.completedAt) {
      return res.json({ alreadyCompleted: true, coinsEarned: existing.coinsEarned });
    }

    await prisma.dailyChallenge.upsert({
      where: { kidId_date: { kidId, date: today } },
      create: {
        kidId,
        date: today,
        moduleSlug,
        gameType: 'daily',
        coinsEarned: BONUS_COINS,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
        coinsEarned: BONUS_COINS,
      },
    });

    await prisma.kidProfile.update({
      where: { id: kidId },
      data: { coins: { increment: BONUS_COINS } },
    });

    res.json({ success: true, coinsEarned: BONUS_COINS });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
