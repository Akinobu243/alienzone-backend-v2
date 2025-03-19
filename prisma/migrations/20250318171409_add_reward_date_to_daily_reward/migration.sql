/*
  Warnings:

  - Added the required column `rewardDate` to the `DailyReward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyReward" ADD COLUMN     "rewardDate" TIMESTAMP(3) NOT NULL;
