-- AlterTable
ALTER TABLE "KidProfile" ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "KidProfile" ADD COLUMN "lastActivityDate" TIMESTAMP(3);
