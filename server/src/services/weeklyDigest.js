'use strict';
const { Resend } = require('resend');
const prisma = require('../lib/db');

const FROM = process.env.DIGEST_FROM_EMAIL || 'KidsLearn <digest@kidslearn.app>';

// ─── Query helpers ────────────────────────────────────────────────────────────

async function getKidWeeklyStats(kidId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [kid, allProgress, weekProgress, modules] = await Promise.all([
    prisma.kidProfile.findUnique({ where: { id: kidId } }),

    prisma.lessonProgress.findMany({
      where: { kidId },
      select: { starsEarned: true },
    }),

    prisma.lessonProgress.findMany({
      where: { kidId, updatedAt: { gte: sevenDaysAgo }, starsEarned: { gt: 0 } },
      select: { starsEarned: true },
    }),

    prisma.module.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          include: { progress: { where: { kidId } } },
        },
      },
    }),
  ]);

  const lessonsThisWeek = weekProgress.length;
  const starsThisWeek  = weekProgress.reduce((s, p) => s + p.starsEarned, 0);

  // Recommended: least-progressed incomplete module
  let recommended = null;
  let lowestPct = 1;
  for (const mod of modules) {
    const total = mod.lessons.length;
    if (!total) continue;
    const done = mod.lessons.filter(l => (l.progress[0]?.starsEarned ?? 0) > 0).length;
    const pct  = done / total;
    if (pct < 1 && pct <= lowestPct) {
      lowestPct = pct;
      recommended = { title: mod.title, iconEmoji: mod.iconEmoji, pct: Math.round(pct * 100) };
    }
  }

  return { kid, lessonsThisWeek, starsThisWeek, recommended };
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildEmailHtml(parentName, kidsStats) {
  const kidCards = kidsStats.map(({ kid, lessonsThisWeek, starsThisWeek, recommended }) => `
    <div style="background:#fff;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="margin:0 0 16px;font-size:22px;color:#1e293b;">
        ${kid.name}
        <span style="font-size:16px;color:#64748b;font-weight:400;margin-left:8px;">
          🔥 ${kid.currentStreak}-day streak
        </span>
      </h2>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <div style="flex:1;min-width:100px;background:#FEF9C3;border-radius:12px;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#92400E;">⭐ ${kid.totalStars}</div>
          <div style="font-size:12px;color:#78350F;margin-top:4px;">Total Stars</div>
        </div>
        <div style="flex:1;min-width:100px;background:#E0F2FE;border-radius:12px;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#0369A1;">📚 ${lessonsThisWeek}</div>
          <div style="font-size:12px;color:#075985;margin-top:4px;">Lessons This Week</div>
        </div>
        <div style="flex:1;min-width:100px;background:#DCFCE7;border-radius:12px;padding:14px;text-align:center;">
          <div style="font-size:28px;font-weight:900;color:#15803D;">🪙 ${kid.coins}</div>
          <div style="font-size:12px;color:#166534;margin-top:4px;">Coins</div>
        </div>
      </div>

      ${recommended ? `
      <div style="background:#F0F9FF;border-left:4px solid #38BDF8;border-radius:8px;padding:12px 16px;">
        <div style="font-size:13px;color:#0369A1;font-weight:700;margin-bottom:4px;">Recommended next</div>
        <div style="font-size:16px;font-weight:700;color:#1e293b;">
          ${recommended.iconEmoji} ${recommended.title}
          <span style="font-size:13px;color:#64748b;font-weight:400;margin-left:6px;">${recommended.pct}% complete</span>
        </div>
      </div>
      ` : `
      <div style="background:#F0FDF4;border-left:4px solid #4ADE80;border-radius:8px;padding:12px 16px;">
        <div style="font-size:16px;font-weight:700;color:#15803D;">🏆 All modules completed!</div>
      </div>
      `}
    </div>
  `).join('');

  const greeting = parentName ? `Hi ${parentName}` : 'Hi there';
  const anyActive = kidsStats.some(s => s.lessonsThisWeek > 0);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px 32px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:20px 20px 0 0;padding:32px;text-align:center;margin-bottom:0;">
      <div style="font-size:48px;margin-bottom:8px;">📚</div>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">Weekly Learning Digest</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">
        ${greeting} — here's what happened this week!
      </p>
    </div>

    <!-- Body -->
    <div style="background:#F1F5F9;padding:24px;border-radius:0 0 20px 20px;">
      ${anyActive
        ? `<p style="color:#475569;font-size:15px;margin:0 0 20px;">
             ${kidsStats.length === 1 ? 'Your child has' : 'Your kids have'} been learning — great job keeping the streak going! 🎉
           </p>`
        : `<p style="color:#475569;font-size:15px;margin:0 0 20px;">
             No lessons this week yet — why not open KidsLearn together today? 😊
           </p>`
      }

      ${kidCards}

      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.CLIENT_URL || 'https://kidslearn.app'}/dashboard"
           style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:800;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;">
          View Full Dashboard →
        </a>
      </div>
    </div>

    <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:20px;">
      You're receiving this because you have a KidsLearn account.
    </p>
  </div>
</body>
</html>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

async function sendWeeklyDigests() {
  if (!process.env.RESEND_API_KEY) {
    console.log('[digest] RESEND_API_KEY not set — skipping weekly digest');
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log('[digest] Starting weekly digest send…');

  const parents = await prisma.user.findMany({
    include: { kids: true },
  });

  let sent = 0, failed = 0;

  for (const parent of parents) {
    if (!parent.kids.length) continue;

    try {
      const kidsStats = await Promise.all(parent.kids.map(k => getKidWeeklyStats(k.id)));
      const html = buildEmailHtml(parent.name, kidsStats);

      await resend.emails.send({
        from: FROM,
        to:   parent.email,
        subject: `📚 Weekly learning update for ${parent.kids.map(k => k.name).join(' & ')}`,
        html,
      });

      sent++;
      console.log(`[digest] Sent to ${parent.email}`);
    } catch (err) {
      failed++;
      console.error(`[digest] Failed for ${parent.email}:`, err.message);
    }
  }

  console.log(`[digest] Done — ${sent} sent, ${failed} failed`);
}

module.exports = { sendWeeklyDigests };
