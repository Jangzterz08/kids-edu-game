-- AlterTable: add subscription fields to User
ALTER TABLE "kids_edu_game"."User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "kids_edu_game"."User" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "kids_edu_game"."User" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "kids_edu_game"."User" ADD COLUMN "subscriptionEnd" TIMESTAMP(3);
ALTER TABLE "kids_edu_game"."User" ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "kids_edu_game"."User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "kids_edu_game"."User"("stripeSubscriptionId");
