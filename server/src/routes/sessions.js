const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// POST /api/sessions/heartbeat — kid auth required
// Body: { sessionId? } — null/missing means create new session
router.post('/heartbeat', async (req, res, next) => {
  try {
    // Only kids (type === 'kid') can call the heartbeat endpoint
    if (!req.user || req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Kid authentication required' });
    }

    const kidId = req.user.id;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      // No session ID provided — create new session
      const session = await prisma.session.create({
        data: { kidId },
      });
      return res.json({ sessionId: session.id });
    }

    // Session ID provided — try to update it
    const updated = await prisma.session.updateMany({
      where: { id: sessionId, kidId },
      data: { lastHeartbeatAt: new Date() },
    });

    if (updated.count === 0) {
      // Session not found or belongs to different kid — create a new one
      const session = await prisma.session.create({
        data: { kidId },
      });
      return res.json({ sessionId: session.id });
    }

    return res.json({ sessionId });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/end — kid auth required
// Body: { sessionId }
router.post('/end', async (req, res, next) => {
  try {
    if (!req.user || req.user.type !== 'kid') {
      return res.status(403).json({ error: 'Kid authentication required' });
    }

    const kidId = req.user.id;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    await prisma.session.updateMany({
      where: { id: sessionId, kidId },
      data: { endedAt: new Date(), lastHeartbeatAt: new Date() },
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
