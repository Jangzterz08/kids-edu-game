import { alphabetModule }        from './modules/alphabet.js';
import { numbersModule }          from './modules/numbers.js';
import { shapesModule }           from './modules/shapes.js';
import { colorsModule }           from './modules/colors.js';
import { animalsModule }          from './modules/animals.js';
import { bodyPartsModule }        from './modules/bodyParts.js';
import { mannersModule }          from './modules/manners.js';
import { householdObjectsModule } from './modules/householdObjects.js';
import { foodPyramidModule }      from './modules/foodPyramid.js';

export const MODULE_REGISTRY = [
  alphabetModule,
  numbersModule,
  shapesModule,
  colorsModule,
  animalsModule,
  bodyPartsModule,
  mannersModule,
  householdObjectsModule,
  foodPyramidModule,
];

export function getModule(slug) {
  return MODULE_REGISTRY.find(m => m.slug === slug);
}

export function getLesson(moduleSlug, lessonSlug) {
  const mod = getModule(moduleSlug);
  return mod?.lessons.find(l => l.slug === lessonSlug);
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
    { word: lesson.word, imageFile: lesson.imageFile, emoji: lesson.emoji, correct: true },
    ...wrongs.map(l => ({ word: l.word, imageFile: l.imageFile, emoji: l.emoji, correct: false })),
  ];
  return options.sort(() => Math.random() - 0.5);
}
