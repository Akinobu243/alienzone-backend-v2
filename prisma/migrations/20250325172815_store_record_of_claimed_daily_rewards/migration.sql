/*
  Warnings:

  - You are about to drop the column `lastDailyRewardId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_lastDailyRewardId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastDailyRewardId";

-- CreateTable
CREATE TABLE "_DailyRewardToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_DailyRewardToUser_AB_unique" ON "_DailyRewardToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_DailyRewardToUser_B_index" ON "_DailyRewardToUser"("B");

-- AddForeignKey
ALTER TABLE "_DailyRewardToUser" ADD CONSTRAINT "_DailyRewardToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyRewardToUser" ADD CONSTRAINT "_DailyRewardToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
