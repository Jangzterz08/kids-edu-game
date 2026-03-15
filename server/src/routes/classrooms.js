const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// Helper: get Prisma user and verify teacher role
async function requireTeacher(req, res) {
  if (req.user.type === 'kid') {
    res.status(403).json({ error: 'Teacher access required' });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
  if (!user || user.role !== 'teacher') {
    res.status(403).json({ error: 'Teacher access required' });
    return null;
  }
  return user;
}

// Generate a 6-char alphanumeric join code
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// GET /api/classrooms — list teacher's classrooms
router.get('/', async (req, res, next) => {
  try {
    const teacher = await requireTeacher(req, res);
    if (!teacher) return;

    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: teacher.id },
      include: { _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ classrooms });
  } catch (err) { next(err); }
});

// POST /api/classrooms — create a classroom
router.post('/', async (req, res, next) => {
  try {
    const teacher = await requireTeacher(req, res);
    if (!teacher) return;

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    // Generate unique join code (retry on collision)
    let joinCode;
    let attempts = 0;
    while (attempts < 5) {
      joinCode = generateJoinCode();
      const exists = await prisma.classroom.findUnique({ where: { joinCode } });
      if (!exists) break;
      attempts++;
    }

    const classroom = await prisma.classroom.create({
      data: { teacherId: teacher.id, name: name.trim(), joinCode },
    });

    res.status(201).json({ classroom });
  } catch (err) { next(err); }
});

// GET /api/classrooms/:id — classroom detail
router.get('/:id', async (req, res, next) => {
  try {
    const teacher = await requireTeacher(req, res);
    if (!teacher) return;

    const classroom = await prisma.classroom.findUnique({
      where: { id: req.params.id },
      include: {
        students: { include: { kid: { select: { id: true, name: true, avatarId: true } } } },
      },
    });

    if (!classroom || classroom.teacherId !== teacher.id) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    res.json({ classroom });
  } catch (err) { next(err); }
});

// DELETE /api/classrooms/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const teacher = await requireTeacher(req, res);
    if (!teacher) return;

    const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
    if (!classroom || classroom.teacherId !== teacher.id) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    await prisma.classroom.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/classrooms/:id/leaderboard — ranked students (teacher OR enrolled kid)
router.get('/:id/leaderboard', async (req, res, next) => {
  try {
    const classroomId = req.params.id;

    // Authorize: teacher who owns it, or kid enrolled in it
    if (req.user.type === 'kid') {
      const enrolled = await prisma.classroomStudent.findUnique({
        where: { classroomId_kidId: { classroomId, kidId: req.user.id } },
      });
      if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this classroom' });
    } else {
      const dbUser = await prisma.user.findUnique({ where: { supabaseAuthId: req.user.id } });
      if (!dbUser) return res.status(401).json({ error: 'User not found' });

      // Teachers can view their classrooms; parents can view classrooms their kids are in
      if (dbUser.role === 'teacher') {
        const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
        if (!classroom || classroom.teacherId !== dbUser.id) {
          return res.status(403).json({ error: 'Not your classroom' });
        }
      } else {
        // Parent: check if any of their kids are enrolled
        const enrolled = await prisma.classroomStudent.findFirst({
          where: { classroomId, kid: { parentId: dbUser.id } },
        });
        if (!enrolled) return res.status(403).json({ error: 'No access to this classroom' });
      }
    }

    const students = await prisma.classroomStudent.findMany({
      where: { classroomId },
      include: {
        kid: {
          select: {
            id: true, name: true, avatarId: true,
            totalStars: true, currentStreak: true,
            progress: { where: { starsEarned: { gt: 0 } }, select: { id: true } },
          },
        },
      },
    });

    const leaderboard = students
      .map(s => ({
        kidId: s.kid.id,
        name: s.kid.name,
        avatarId: s.kid.avatarId,
        totalStars: s.kid.totalStars,
        currentStreak: s.kid.currentStreak,
        lessonsCompleted: s.kid.progress.length,
      }))
      .sort((a, b) =>
        b.totalStars - a.totalStars ||
        b.currentStreak - a.currentStreak ||
        b.lessonsCompleted - a.lessonsCompleted
      )
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({ leaderboard });
  } catch (err) { next(err); }
});

// POST /api/classrooms/:id/remove-student — teacher removes a kid
router.post('/:id/remove-student', async (req, res, next) => {
  try {
    const teacher = await requireTeacher(req, res);
    if (!teacher) return;

    const { kidId } = req.body;
    if (!kidId) return res.status(400).json({ error: 'kidId is required' });

    const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
    if (!classroom || classroom.teacherId !== teacher.id) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    await prisma.classroomStudent.delete({
      where: { classroomId_kidId: { classroomId: req.params.id, kidId } },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
