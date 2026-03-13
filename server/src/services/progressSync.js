const prisma = require('../lib/db');

const SCORE_FIELDS = ['matchScore', 'traceScore', 'quizScore', 'spellingScore', 'phonicsScore', 'patternScore', 'oddOneOutScore'];

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

  const existing = await prisma.lessonProgress.findUnique({
    where: { kidId_lessonId: { kidId, lessonId } },
  });

  const finalStars = Math.max(starsEarned, existing?.starsEarned ?? 0);

  // Build score fields — keep best score for each game type
  const scoreData = {};
  for (const field of SCORE_FIELDS) {
    scoreData[field] = maxScore(entry[field], existing?.[field]);
  }

  const record = await prisma.lessonProgress.upsert({
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

  // Update totalStars and coins on kid profile
  const starDelta = finalStars - (existing?.starsEarned ?? 0);
  const coinsDelta = starDelta > 0 ? starDelta * 5 : 3;

  if (starDelta > 0) {
    await prisma.kidProfile.update({
      where: { id: kidId },
      data: { totalStars: { increment: starDelta } },
    });
  }
  if (coinsDelta > 0) {
    await prisma.kidProfile.update({
      where: { id: kidId },
      data: { coins: { increment: coinsDelta } },
    });
  }

  return { ...record, coinsDelta };
}

function maxScore(a, b) {
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return Math.max(a, b);
}

module.exports = { upsertProgress, SCORE_FIELDS };
