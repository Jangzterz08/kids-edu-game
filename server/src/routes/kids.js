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

// GET /api/kids
router.get('/', async (req, res, next) => {
  try {
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
    const parent = await getParent(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Parent account not found' });
    const kid = await verifyKidOwnership(req.params.kidId, parent.id);
    if (!kid) return res.status(404).json({ error: 'Kid not found' });

    const { itemId, price } = req.body;
    if (!itemId || price == null) return res.status(400).json({ error: 'itemId and price required' });

    const unlocked = JSON.parse(kid.unlockedItems || '[]');
    if (unlocked.includes(itemId)) return res.status(400).json({ error: 'Already unlocked' });
    if (kid.coins < price) return res.status(400).json({ error: 'Not enough coins' });

    const updated = await prisma.kidProfile.update({
      where: { id: kid.id },
      data: {
        coins: { decrement: price },
        unlockedItems: JSON.stringify([...unlocked, itemId]),
      },
    });
    res.json({ coins: updated.coins, unlockedItems: JSON.parse(updated.unlockedItems) });
  } catch (err) {
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

module.exports = router;
