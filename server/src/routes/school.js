const express = require('express');
const router = express.Router();
const prisma = require('../lib/db');

// Helper: get dbUser from Supabase auth ID
async function getDbUser(req, res) {
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

// Helper: verify school admin
async function requireSchoolAdmin(req, res) {
  const user = await getDbUser(req, res);
  if (!user) return null;
  const membership = await prisma.schoolTeacher.findUnique({
    where: { userId: user.id },
    include: { school: true },
  });
  if (!membership || membership.role !== 'admin') {
    res.status(403).json({ error: 'School admin access required' });
    return null;
  }
  return { user, school: membership.school, membership };
}

// POST /api/school — create a new school (any teacher, becomes admin)
router.post('/', async (req, res, next) => {
  try {
    const user = await getDbUser(req, res);
    if (!user) return;

    // Check teacher doesn't already belong to a school
    const existing = await prisma.schoolTeacher.findUnique({ where: { userId: user.id } });
    if (existing) {
      return res.status(409).json({ error: 'You already belong to a school' });
    }

    const { name, contactEmail } = req.body;
    if (!name || !contactEmail) {
      return res.status(400).json({ error: 'name and contactEmail are required' });
    }

    const school = await prisma.school.create({
      data: {
        name,
        contactEmail,
        teachers: {
          create: { userId: user.id, role: 'admin' },
        },
      },
      include: { teachers: true },
    });

    res.status(201).json({ school });
  } catch (err) {
    next(err);
  }
});

// GET /api/school/me — current school info for admin
router.get('/me', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;
    const { school } = ctx;

    const seatsUsed = await prisma.schoolTeacher.count({ where: { schoolId: school.id } });
    res.json({ school: { ...school, seatsUsed } });
  } catch (err) {
    next(err);
  }
});

// GET /api/school/teachers — list provisioned teachers
router.get('/teachers', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;

    const teachers = await prisma.schoolTeacher.findMany({
      where: { schoolId: ctx.school.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { addedAt: 'asc' },
    });

    // Include classroom count per teacher
    const teacherData = await Promise.all(teachers.map(async t => {
      const classroomCount = await prisma.classroom.count({ where: { teacherId: t.userId } });
      return {
        id: t.id,
        userId: t.userId,
        email: t.user.email,
        name: t.user.name,
        role: t.role,
        addedAt: t.addedAt,
        classroomCount,
      };
    }));

    res.json({ teachers: teacherData });
  } catch (err) {
    next(err);
  }
});

// POST /api/school/teachers — add teacher by email (seat cap enforced in transaction)
router.post('/teachers', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;
    const { school } = ctx;

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ error: 'No teacher account found with that email. Teacher must sign up first.' });
    }
    if (targetUser.role !== 'teacher') {
      return res.status(400).json({ error: 'User is not a teacher account' });
    }

    // Check not already in a school
    const existingMembership = await prisma.schoolTeacher.findUnique({ where: { userId: targetUser.id } });
    if (existingMembership) {
      return res.status(409).json({ error: 'Teacher already belongs to a school' });
    }

    // Seat cap check + create inside transaction to prevent race condition
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        const currentCount = await tx.schoolTeacher.count({ where: { schoolId: school.id } });
        if (currentCount >= school.seatCount) {
          throw new Error('SEAT_CAP_REACHED');
        }
        return tx.schoolTeacher.create({
          data: { schoolId: school.id, userId: targetUser.id, role: 'teacher' },
        });
      });
    } catch (txErr) {
      if (txErr.message === 'SEAT_CAP_REACHED') {
        return res.status(403).json({ error: `Seat limit reached (${school.seatCount} seats). Upgrade your plan for more seats.` });
      }
      throw txErr;
    }

    res.status(201).json({ teacher: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/school/teachers/:userId — remove teacher from school
router.delete('/teachers/:userId', async (req, res, next) => {
  try {
    const ctx = await requireSchoolAdmin(req, res);
    if (!ctx) return;

    // Cannot remove yourself (admin)
    if (req.params.userId === ctx.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself as school admin' });
    }

    const membership = await prisma.schoolTeacher.findFirst({
      where: { schoolId: ctx.school.id, userId: req.params.userId },
    });
    if (!membership) {
      return res.status(404).json({ error: 'Teacher not found in this school' });
    }

    await prisma.schoolTeacher.delete({ where: { id: membership.id } });
    res.json({ removed: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
