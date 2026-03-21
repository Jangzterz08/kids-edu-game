/**
 * SM-2 spaced repetition algorithm + age-adjusted difficulty classification.
 *
 * References:
 *   - Original SM-2 paper by Piotr Wozniak
 *   - ADL-01 adaptive learning requirement
 */

'use strict';

/**
 * Age-group threshold lookup table.
 * Keys are age group strings as stored in KidProfile.ageGroup.
 * easy: score >= easy -> 'easy'
 * medLow: score >= medLow -> 'medium', else -> 'hard'
 */
const THRESHOLDS = {
  '3-4': { easy: 70, medLow: 50 },
  '5-6': { easy: 75, medLow: 60 },
  '7-8': { easy: 80, medLow: 65 },
};

const DEFAULT_THRESHOLD = { easy: 75, medLow: 60 };

/**
 * Returns threshold object { easy, medLow } for the given ageGroup.
 * Falls back to '5-6' defaults for null or unrecognized values.
 *
 * @param {string|null} ageGroup
 * @returns {{ easy: number, medLow: number }}
 */
function getThresholds(ageGroup) {
  return THRESHOLDS[ageGroup] || DEFAULT_THRESHOLD;
}

/**
 * Returns the numeric "hard threshold" (medLow) below which a score is classified as hard.
 *
 * @param {string|null} ageGroup
 * @returns {number}
 */
function getHardThreshold(ageGroup) {
  return getThresholds(ageGroup).medLow;
}

/**
 * Classifies an accuracy percentage into 'easy', 'medium', or 'hard'
 * relative to the age-adjusted thresholds.
 *
 * @param {number} accuracyPct - Score as 0-100 float
 * @param {string|null} ageGroup
 * @returns {'easy'|'medium'|'hard'}
 */
function classifyAccuracy(accuracyPct, ageGroup) {
  const { easy, medLow } = getThresholds(ageGroup);
  if (accuracyPct >= easy) return 'easy';
  if (accuracyPct >= medLow) return 'medium';
  return 'hard';
}

/**
 * Applies the SM-2 algorithm to compute the next review interval, ease factor,
 * review count, and due date.
 *
 * Formula (from Wozniak's SM-2):
 *   q = (scorePercent / 100) * 5  (maps 0-100% to 0-5 quality rating)
 *   if q >= 3 (passing):
 *     reviewCount 0 -> interval 1 day
 *     reviewCount 1 -> interval 6 days
 *     reviewCount 2+ -> interval = round(interval * easeFactor)
 *     newEaseFactor = max(1.3, EF + 0.1 - (5-q)(0.08 + (5-q)*0.02))
 *   if q < 3 (failing):
 *     interval resets to 1
 *     easeFactor unchanged
 *
 * @param {{ interval: number, easeFactor: number, reviewCount: number }} current
 * @param {number} scorePercent - 0-100 score
 * @returns {{ interval: number, easeFactor: number, reviewCount: number, dueDate: Date, lastReviewedAt: Date }}
 */
function applySM2({ interval, easeFactor, reviewCount }, scorePercent) {
  const q = (scorePercent / 100) * 5;

  let newInterval;
  let newEaseFactor;

  if (q >= 3) {
    // Passing score
    if (reviewCount === 0) {
      newInterval = 1;
    } else if (reviewCount === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newEaseFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    // Failing score — reset interval, keep easeFactor
    newInterval = 1;
    newEaseFactor = easeFactor;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    reviewCount: reviewCount + 1,
    dueDate,
    lastReviewedAt: new Date(),
  };
}

module.exports = { applySM2, classifyAccuracy, getHardThreshold, getThresholds };
