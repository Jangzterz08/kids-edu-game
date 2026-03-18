-- Add scrambleScore to LessonProgress for the new Word Scramble game
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "scrambleScore" INTEGER;
