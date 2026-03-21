-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL DEFAULT 10,
    "licenseStatus" TEXT NOT NULL DEFAULT 'none',
    "licenseExpiry" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolTeacher" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'teacher',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_stripeCustomerId_key" ON "School"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "School_stripeSubscriptionId_key" ON "School"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolTeacher_userId_key" ON "SchoolTeacher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolTeacher_schoolId_userId_key" ON "SchoolTeacher"("schoolId", "userId");

-- AddForeignKey
ALTER TABLE "SchoolTeacher" ADD CONSTRAINT "SchoolTeacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolTeacher" ADD CONSTRAINT "SchoolTeacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
