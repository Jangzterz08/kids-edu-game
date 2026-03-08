const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// GET /api/modules
router.get('/', async (req, res, next) => {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ modules });
  } catch (err) {
    next(err);
  }
});

// GET /api/modules/:moduleSlug
router.get('/:moduleSlug', async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({
      where: { slug: req.params.moduleSlug },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
