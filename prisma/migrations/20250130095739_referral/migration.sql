-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "refereeId" INTEGER NOT NULL,
    "starsEarned" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_idx" ON "ReferralReward"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralReward_refereeId_idx" ON "ReferralReward"("refereeId");

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
