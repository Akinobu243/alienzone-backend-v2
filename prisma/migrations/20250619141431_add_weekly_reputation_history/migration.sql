-- CreateTable
CREATE TABLE "WeeklyReputationHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "weekStarting" TIMESTAMP(3) NOT NULL,
    "weekEnding" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReputationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyReputationHistory_userId_idx" ON "WeeklyReputationHistory"("userId");

-- CreateIndex
CREATE INDEX "WeeklyReputationHistory_weekStarting_weekEnding_idx" ON "WeeklyReputationHistory"("weekStarting", "weekEnding");

-- AddForeignKey
ALTER TABLE "WeeklyReputationHistory" ADD CONSTRAINT "WeeklyReputationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
