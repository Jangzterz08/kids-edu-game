import { alphabetModule }        from './modules/alphabet.js';
import { numbersModule }          from './modules/numbers.js';
import { shapesModule }           from './modules/shapes.js';
import { colorsModule }           from './modules/colors.js';
import { animalsModule }          from './modules/animals.js';
import { bodyPartsModule }        from './modules/bodyParts.js';
import { mannersModule }          from './modules/manners.js';
import { householdObjectsModule } from './modules/householdObjects.js';
import { foodPyramidModule }      from './modules/foodPyramid.js';
import { emotionsModule }         from './modules/emotions.js';
import { weatherModule }          from './modules/weather.js';
import { daysOfWeekModule }       from './modules/daysOfWeek.js';
import { logicModule }            from './modules/logic.js';

export const MODULE_REGISTRY = [
  logicModule, // Placed first so it shows prominently during development
  alphabetModule,
  numbersModule,
  shapesModule,
  colorsModule,
  animalsModule,
  bodyPartsModule,
  mannersModule,
  householdObjectsModule,
  foodPyramidModule,
  emotionsModule,
  weatherModule,
  daysOfWeekModule,
];

export function getModule(slug) {
  return MODULE_REGISTRY.find(m => m.slug === slug);
}

export function getLesson(moduleSlug, lessonSlug) {
  const mod = getModule(moduleSlug);
  return mod?.lessons.find(l => l.slug === lessonSlug);
}

// Deterministic daily challenge module — cycles through all modules day by day
const DAILY_MODULE_SLUGS = [
  'logic', 'alphabet', 'numbers', 'shapes', 'colors',
  'animals', 'body-parts', 'manners', 'household',
  'food-pyramid', 'emotions', 'weather', 'days-of-week',
];
export function getDailyChallengeSlug() {
  const start = new Date(new Date().getFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_MODULE_SLUGS[dayOfYear % DAILY_MODULE_SLUGS.length];
}

// Fill quiz options for a lesson using 3 random wrong answers from same module
export function buildQuizOptions(moduleSlug, lessonSlug) {
  const mod = getModule(moduleSlug);
  if (!mod) return [];
  const lesson = mod.lessons.find(l => l.slug === lessonSlug);
  if (!lesson) return [];

  const others = mod.lessons.filter(l => l.slug !== lessonSlug);
  const wrongs = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [
    { word: lesson.word, imageFile: lesson.imageFile, emoji: lesson.emoji, dotCount: lesson.dotCount, correct: true },
    ...wrongs.map(l => ({ word: l.word, imageFile: l.imageFile, emoji: l.emoji, dotCount: l.dotCount, correct: false })),
  ];
  return options.sort(() => Math.random() - 0.5);
}
