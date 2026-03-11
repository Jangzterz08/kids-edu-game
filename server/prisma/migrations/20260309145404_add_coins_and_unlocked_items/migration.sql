-- AlterTable
ALTER TABLE "KidProfile" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unlockedItems" TEXT NOT NULL DEFAULT '[]';
