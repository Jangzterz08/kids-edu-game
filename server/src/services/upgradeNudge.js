'use strict';
const { Resend } = require('resend');
const prisma = require('../lib/db');
const he = require('he');

const FROM = process.env.DIGEST_FROM_EMAIL || 'KidsLearn <digest@kidslearn.app>';

function esc(str) {
  return he.escape(str || '');
}

async function sendUpgradeNudge(parentId) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[nudge] RESEND_API_KEY not set — skipping');
      return;
    }

    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, email: true, name: true, lastNudgeEmailAt: true },
    });

    if (!parent) {
      console.log(`[nudge] Parent not found: ${parentId}`);
      return;
    }

    // Rate limit: max 1 nudge per parent per 24 hours
    if (
      parent.lastNudgeEmailAt !== null &&
      Date.now() - parent.lastNudgeEmailAt.getTime() < 24 * 60 * 60 * 1000
    ) {
      console.log(`[nudge] Rate limited for ${parent.email}`);
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const greeting = parent.name ? `Hi ${esc(parent.name)}` : 'Hi there';
    const upgradeUrl = `${process.env.CLIENT_URL || 'https://kidslearn.app'}/parent`;

    const subject = 'Your child tried to access a premium module on KidsLearn';
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px 32px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:20px 20px 0 0;padding:32px;text-align:center;margin-bottom:0;">
      <div style="font-size:48px;margin-bottom:8px;">🔒</div>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">Premium Module Locked</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:15px;">
        ${greeting} — your child wants to learn more!
      </p>
    </div>

    <!-- Body -->
    <div style="background:#F1F5F9;padding:24px;border-radius:0 0 20px 20px;">
      <p style="color:#475569;font-size:15px;margin:0 0 20px;">
        Your child just tried to access a premium learning module on KidsLearn, but their access is currently locked.
      </p>
      <p style="color:#475569;font-size:15px;margin:0 0 24px;">
        Upgrade to KidsLearn Premium to unlock all 13 modules and give your child access to hundreds of engaging lessons in letters, numbers, animals, colours, and more!
      </p>

      <div style="text-align:center;margin-top:24px;">
        <a href="${upgradeUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;font-weight:800;font-size:16px;padding:14px 32px;border-radius:50px;text-decoration:none;">
          Upgrade to Premium →
        </a>
      </div>
    </div>

    <p style="text-align:center;color:#94A3B8;font-size:12px;margin-top:20px;">
      You're receiving this because your child attempted to access a locked module on KidsLearn.
    </p>
  </div>
</body>
</html>`;

    await resend.emails.send({ from: FROM, to: parent.email, subject, html });

    await prisma.user.update({
      where: { id: parentId },
      data: { lastNudgeEmailAt: new Date() },
    });

    console.log(`[nudge] Upgrade nudge sent to ${parent.email}`);
  } catch (err) {
    console.error('[nudge] Error sending upgrade nudge:', err.message);
    // Never throw — this is fire-and-forget
  }
}

module.exports = { sendUpgradeNudge };
