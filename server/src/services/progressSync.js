const prisma = require('../lib/db');
const { classifyAccuracy, getHardThreshold, applySM2 } = require('../lib/sm2');

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

async function upsertProgress(kidId, entry, ageGroup) {
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

    // --- Step 3a: Compute module accuracy and upsert ModuleDifficulty ---
    // Guard: only proceed if entry.moduleSlug is present (bulk sync entries may omit it)
    if (entry.moduleSlug) {
      const moduleProgress = await tx.lessonProgress.findMany({
        where: { kidId, lesson: { module: { slug: entry.moduleSlug } } },
        select: {
          matchScore: true, traceScore: true, quizScore: true, spellingScore: true,
          phonicsScore: true, patternScore: true, oddOneOutScore: true, scrambleScore: true,
        },
      });

      // Best score per lesson row (max across game types with at least one non-null score)
      const lessonBests = moduleProgress
        .map(row => {
          const scores = SCORE_FIELDS.map(f => row[f]).filter(s => s !== null && s !== undefined);
          return scores.length > 0 ? Math.max(...scores) : null;
        })
        .filter(s => s !== null);

      if (lessonBests.length > 0) {
        const accuracyPct = lessonBests.reduce((a, b) => a + b, 0) / lessonBests.length;
        const level = classifyAccuracy(accuracyPct, ageGroup ?? null);
        // accuracy stored as 0-100 (raw percentage matching score field values)
        await tx.moduleDifficulty.upsert({
          where: { kidId_moduleSlug: { kidId, moduleSlug: entry.moduleSlug } },
          create: { kidId, moduleSlug: entry.moduleSlug, level, accuracy: accuracyPct },
          update: { level, accuracy: accuracyPct },
        });
      }
    }

    // --- Step 3b: Create or update ReviewSchedule via SM-2 ---
    const lessonScores = SCORE_FIELDS.map(f => record[f]).filter(s => s !== null && s !== undefined);
    if (lessonScores.length > 0) {
      const lessonBestScore = Math.max(...lessonScores);
      const hardThreshold = getHardThreshold(ageGroup ?? null);
      const existingReview = await tx.reviewSchedule.findUnique({
        where: { kidId_lessonId: { kidId, lessonId: entry.lessonId } },
      });

      if (!existingReview && lessonBestScore < hardThreshold) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        await tx.reviewSchedule.create({
          data: {
            kidId,
            lessonId: entry.lessonId,
            dueDate,
            interval: 1,
            easeFactor: 2.5,
            reviewCount: 0,
            lastReviewedAt: null,
          },
        });
      } else if (existingReview) {
        const sm2Result = applySM2(existingReview, lessonBestScore);
        await tx.reviewSchedule.update({
          where: { kidId_lessonId: { kidId, lessonId: entry.lessonId } },
          data: sm2Result,
        });
      }
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
