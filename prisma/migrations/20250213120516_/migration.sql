/*
  Warnings:

  - The values [ALIEN_PART] on the enum `PackRewardType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `alienPartId` on the `PackReward` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PackRewardType_new" AS ENUM ('STARS', 'ALIEN_PARTS', 'ALIEN_PART_GROUP', 'XP', 'REP', 'CHARACTER');
ALTER TABLE "PackReward" ALTER COLUMN "type" TYPE "PackRewardType_new" USING ("type"::text::"PackRewardType_new");
ALTER TYPE "PackRewardType" RENAME TO "PackRewardType_old";
ALTER TYPE "PackRewardType_new" RENAME TO "PackRewardType";
DROP TYPE "PackRewardType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PackReward" DROP CONSTRAINT "PackReward_alienPartId_fkey";

-- DropIndex
DROP INDEX "PackReward_alienPartId_idx";

-- AlterTable
ALTER TABLE "PackReward" DROP COLUMN "alienPartId",
ADD COLUMN     "alienPartGroupId" INTEGER;

-- CreateTable
CREATE TABLE "_AlienPartToPackReward" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToPackReward_AB_unique" ON "_AlienPartToPackReward"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToPackReward_B_index" ON "_AlienPartToPackReward"("B");

-- CreateIndex
CREATE INDEX "PackReward_alienPartGroupId_idx" ON "PackReward"("alienPartGroupId");

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_alienPartGroupId_fkey" FOREIGN KEY ("alienPartGroupId") REFERENCES "AlienPartGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToPackReward" ADD CONSTRAINT "_AlienPartToPackReward_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToPackReward" ADD CONSTRAINT "_AlienPartToPackReward_B_fkey" FOREIGN KEY ("B") REFERENCES "PackReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
