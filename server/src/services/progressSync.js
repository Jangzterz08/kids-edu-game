const prisma = require('../lib/db');

const SCORE_FIELDS = ['matchScore', 'traceScore', 'quizScore', 'spellingScore', 'phonicsScore', 'patternScore', 'oddOneOutScore', 'scrambleScore'];

function computeStars(entry) {
  if (!entry.viewed) return 0;
  const scores = SCORE_FIELDS.map(f => entry[f]).filter(s => s !== null && s !== undefined);
  if (scores.length === 0) return 1;
  const allPassed = scores.every(s => s >= 80);
  if (allPassed && scores.length >= 2) return 3;
  if (scores.some(s => s >= 60)) return 2;
  return 1;
}

async function upsertProgress(kidId, entry) {
  const { lessonId, viewed, attempts, completedAt } = entry;
  const starsEarned = entry.starsEarned ?? computeStars(entry);

  // --- Transaction: lesson upsert + stars/coins update (atomic) ---
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.lessonProgress.findUnique({
      where: { kidId_lessonId: { kidId, lessonId } },
    });

    const finalStars = Math.max(starsEarned, existing?.starsEarned ?? 0);

    // Build score fields — keep best score for each game type
    const scoreData = {};
    for (const field of SCORE_FIELDS) {
      scoreData[field] = maxScore(entry[field], existing?.[field]);
    }

    const record = await tx.lessonProgress.upsert({
      where: { kidId_lessonId: { kidId, lessonId } },
      create: {
        kidId,
        lessonId,
        viewed: viewed ?? false,
        ...scoreData,
        starsEarned: finalStars,
        attempts: attempts ?? 1,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      update: {
        viewed: viewed ?? existing?.viewed ?? false,
        ...scoreData,
        starsEarned: finalStars,
        attempts: (existing?.attempts ?? 0) + (attempts ?? 1),
        completedAt: completedAt ? new Date(completedAt) : existing?.completedAt,
      },
    });

    // Update totalStars and coins on kid profile -- merged into single update
    const starDelta = finalStars - (existing?.starsEarned ?? 0);
    const coinsDelta = starDelta > 0 ? starDelta * 5 : 3;

    const dataUpdate = {};
    if (starDelta > 0) dataUpdate.totalStars = { increment: starDelta };
    if (coinsDelta > 0) dataUpdate.coins = { increment: coinsDelta };

    if (Object.keys(dataUpdate).length > 0) {
      await tx.kidProfile.update({
        where: { id: kidId },
        data: dataUpdate,
      });
    }

    return { ...record, coinsDelta };
  });

  // --- Streak update: non-critical, outside transaction ---
  try {
    const kidData = await prisma.kidProfile.findUnique({
      where: { id: kidId },
      select: { currentStreak: true, lastActivityDate: true },
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastStr = kidData?.lastActivityDate
      ? kidData.lastActivityDate.toISOString().slice(0, 10)
      : null;

    if (lastStr !== todayStr) {
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = lastStr === yesterdayStr
        ? (kidData.currentStreak || 0) + 1
        : 1;
      await prisma.kidProfile.update({
        where: { id: kidId },
        data: { currentStreak: newStreak, lastActivityDate: new Date() },
      });
    }
  } catch (streakErr) {
    // Non-critical — don't fail the whole progress save
    console.error('[streak] Update failed:', streakErr.message);
  }

  return result;
}

function maxScore(a, b) {
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return Math.max(a, b);
}

module.exports = { upsertProgress, SCORE_FIELDS };
