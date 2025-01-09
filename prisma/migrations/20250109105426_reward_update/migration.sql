/*
  Warnings:

  - You are about to drop the column `raidId` on the `RaidReward` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RaidReward" DROP CONSTRAINT "RaidReward_raidId_fkey";

-- DropIndex
DROP INDEX "RaidReward_raidId_idx";

-- AlterTable
ALTER TABLE "RaidReward" DROP COLUMN "raidId";

-- CreateTable
CREATE TABLE "_RaidToRaidReward" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RaidToRaidReward_AB_unique" ON "_RaidToRaidReward"("A", "B");

-- CreateIndex
CREATE INDEX "_RaidToRaidReward_B_index" ON "_RaidToRaidReward"("B");

-- AddForeignKey
ALTER TABLE "_RaidToRaidReward" ADD CONSTRAINT "_RaidToRaidReward_A_fkey" FOREIGN KEY ("A") REFERENCES "Raid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidToRaidReward" ADD CONSTRAINT "_RaidToRaidReward_B_fkey" FOREIGN KEY ("B") REFERENCES "RaidReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
