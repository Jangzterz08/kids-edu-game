-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "kidId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_kidId_startedAt_idx" ON "Session"("kidId", "startedAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "KidProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
