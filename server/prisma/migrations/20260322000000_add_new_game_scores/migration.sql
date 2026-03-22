-- Add score columns for sort, trueFalse, and memoryMatch game types
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "sortScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "trueFalseScore" INTEGER;
ALTER TABLE "LessonProgress" ADD COLUMN IF NOT EXISTS "memoryMatchScore" INTEGER;
