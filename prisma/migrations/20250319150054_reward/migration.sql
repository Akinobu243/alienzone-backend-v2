-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastDailyRewardId" INTEGER,
ALTER COLUMN "twitterId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastDailyRewardId_fkey" FOREIGN KEY ("lastDailyRewardId") REFERENCES "DailyReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
