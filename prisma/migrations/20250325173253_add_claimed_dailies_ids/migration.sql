-- AlterTable
ALTER TABLE "User" ADD COLUMN     "claimedDailyRewardIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
