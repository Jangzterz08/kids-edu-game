const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const prisma = require('../lib/db');
const { signKidToken } = require('../middleware/kidAuth');

// POST /api/auth/register — upsert User row after Supabase signup
router.post('/register', async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const validRole = role === 'teacher' ? 'teacher' : 'parent';

    const email = req.user.email;
    if (!email) {
      return res.status(400).json({ error: 'Unable to resolve email from auth token. Please sign out and sign in again.' });
    }

    const user = await prisma.user.upsert({
      where: { supabaseAuthId: req.user.id },
      create: { supabaseAuthId: req.user.id, email, name: name || null, role: validRole },
      update: { email, ...(name && { name }), ...(role && { role: validRole }) },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/kid-set-pin — parent sets/changes a kid's PIN (requires auth)
router.post('/kid-set-pin', async (req, res, next) => {
  try {
    const { kidId, pin } = req.body;

    if (!kidId || !pin) {
      return res.status(400).json({ error: 'kidId and pin are required' });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }

    // Verify parent owns this kid
    const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
    if (!dbUser) return res.status(404).json({ error: 'User not found' });

    const kid = await prisma.kidProfile.findUnique({ where: { id: kidId } });
    if (!kid || kid.parentId !== dbUser.id) {
      return res.status(403).json({ error: 'Not your kid' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.kidProfile.update({
      where: { id: kidId },
      data: { pin: hashedPin },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// --- Public kid auth endpoints (no requireAuth) ---

// POST /api/auth/kid-lookup — find kids by name who have a PIN set
async function kidLookupHandler(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const kids = await prisma.kidProfile.findMany({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        pin: { not: null },
      },
      select: { id: true, name: true, avatarId: true },
    });

    res.json({ kids });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/kid-login — authenticate kid with PIN
async function kidLoginHandler(req, res, next) {
  try {
    const { kidId, pin } = req.body;
    if (!kidId || !pin) {
      return res.status(400).json({ error: 'kidId and pin are required' });
    }

    const kid = await prisma.kidProfile.findUnique({
      where: { id: kidId },
      select: {
        id: true, name: true, avatarId: true, ageGroup: true,
        totalStars: true, currentStreak: true, coins: true, unlockedItems: true,
        pin: true,
      },
    });

    if (!kid || !kid.pin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(pin, kid.pin);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signKidToken(kid.id);

    // Don't return the pin hash to the client
    const { pin: _pin, ...kidData } = kid;
    res.json({ token, kid: kidData });
  } catch (err) {
    next(err);
  }
}

module.exports = router;
module.exports.kidLookupHandler = kidLookupHandler;
module.exports.kidLoginHandler = kidLoginHandler;
