'use strict';

const DAILY_SLUGS = [
  'logic', 'alphabet', 'numbers', 'shapes', 'colors',
  'animals', 'body-parts', 'manners', 'household',
  'food-pyramid', 'emotions', 'weather', 'days-of-week',
];

function todayDate() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getChallengeSlug() {
  const start = new Date(new Date().getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_SLUGS[dayOfYear % DAILY_SLUGS.length];
}

module.exports = { DAILY_SLUGS, todayDate, getChallengeSlug };
