/*
  Warnings:

  - You are about to drop the column `lastDaily` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DailyRewardType" AS ENUM ('ITEM', 'STARS', 'XP');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastDaily",
ADD COLUMN     "dailyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastDailyClaimed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "DailyReward" (
    "id" SERIAL NOT NULL,
    "type" "DailyRewardType" NOT NULL,
    "itemId" INTEGER,
    "amount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReward_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DailyReward" ADD CONSTRAINT "DailyReward_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
