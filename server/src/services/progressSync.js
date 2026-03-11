const prisma = require('../lib/db');

function computeStars(entry) {
  const { viewed, matchScore, traceScore, quizScore } = entry;
  if (!viewed) return 0;
  const allGames = [matchScore, traceScore, quizScore].filter(s => s !== null && s !== undefined);
  if (allGames.length === 0) return 1;
  const allPassed = allGames.every(s => s >= 80);
  if (allPassed && allGames.length >= 2) return 3;
  if (quizScore !== null && quizScore !== undefined && quizScore >= 60) return 2;
  return 1;
}

async function upsertProgress(kidId, entry) {
  const { lessonId, viewed, matchScore, traceScore, quizScore, attempts, completedAt } = entry;
  const starsEarned = entry.starsEarned ?? computeStars(entry);

  // Get existing record to avoid downgrading stars
  const existing = await prisma.lessonProgress.findUnique({
    where: { kidId_lessonId: { kidId, lessonId } },
  });

  const finalStars = Math.max(starsEarned, existing?.starsEarned ?? 0);
  const finalMatch = maxScore(matchScore, existing?.matchScore);
  const finalTrace = maxScore(traceScore, existing?.traceScore);
  const finalQuiz = maxScore(quizScore, existing?.quizScore);

  const record = await prisma.lessonProgress.upsert({
    where: { kidId_lessonId: { kidId, lessonId } },
    create: {
      kidId,
      lessonId,
      viewed: viewed ?? false,
      matchScore: finalMatch,
      traceScore: finalTrace,
      quizScore: finalQuiz,
      starsEarned: finalStars,
      attempts: attempts ?? 1,
      completedAt: completedAt ? new Date(completedAt) : null,
    },
    update: {
      viewed: viewed ?? existing?.viewed ?? false,
      matchScore: finalMatch,
      traceScore: finalTrace,
      quizScore: finalQuiz,
      starsEarned: finalStars,
      attempts: (existing?.attempts ?? 0) + (attempts ?? 1),
      completedAt: completedAt ? new Date(completedAt) : existing?.completedAt,
    },
  });

  // Update totalStars and coins on kid profile
  const starDelta = finalStars - (existing?.starsEarned ?? 0);
  const coinsDelta = starDelta > 0 ? starDelta * 5 : 0;
  if (starDelta > 0) {
    await prisma.kidProfile.update({
      where: { id: kidId },
      data: {
        totalStars: { increment: starDelta },
        coins: { increment: coinsDelta },
      },
    });
  }

  return { ...record, coinsDelta };
}

function maxScore(a, b) {
  if (a === null || a === undefined) return b ?? null;
  if (b === null || b === undefined) return a;
  return Math.max(a, b);
}

module.exports = { upsertProgress };
