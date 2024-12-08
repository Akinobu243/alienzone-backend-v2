/*
  Warnings:

  - Changed the type of `type` on the `RaidReward` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('STARS', 'CASH', 'XP', 'REP');

-- AlterTable
ALTER TABLE "RaidReward" DROP COLUMN "type",
ADD COLUMN     "type" "RewardType" NOT NULL;
