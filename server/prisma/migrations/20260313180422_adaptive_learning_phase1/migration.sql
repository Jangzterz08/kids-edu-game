-- AlterTable
ALTER TABLE "LessonProgress" ADD COLUMN     "difficultyLevel" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "oddOneOutScore" INTEGER,
ADD COLUMN     "patternScore" INTEGER,
ADD COLUMN     "phonicsScore" INTEGER,
ADD COLUMN     "spellingScore" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'parent';

-- CreateTable
CREATE TABLE "ModuleDifficulty" (
    "id" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'medium',
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleDifficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "moduleSlug" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "score" INTEGER,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomStudent" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleDifficulty_kidId_moduleSlug_key" ON "ModuleDifficulty"("kidId", "moduleSlug");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_kidId_lessonId_key" ON "ReviewSchedule"("kidId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_kidId_date_key" ON "DailyChallenge"("kidId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_joinCode_key" ON "Classroom"("joinCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomStudent_classroomId_kidId_key" ON "ClassroomStudent"("classroomId", "kidId");

-- AddForeignKey
ALTER TABLE "ModuleDifficulty" ADD CONSTRAINT "ModuleDifficulty_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallenge" ADD CONSTRAINT "DailyChallenge_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomStudent" ADD CONSTRAINT "ClassroomStudent_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
