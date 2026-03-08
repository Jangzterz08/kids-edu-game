const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// POST /api/auth/register — upsert User row after Supabase signup
router.post('/register', async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.upsert({
      where: { supabaseAuthId: req.user.id },
      create: { supabaseAuthId: req.user.id, email: req.user.email, name: name || null },
      update: { email: req.user.email, ...(name && { name }) },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
