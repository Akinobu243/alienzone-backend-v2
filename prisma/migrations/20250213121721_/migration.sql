/*
  Warnings:

  - The values [ALIEN_PART_GROUP] on the enum `PackRewardType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `alienPartGroupId` on the `PackReward` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PackRewardType_new" AS ENUM ('STARS', 'ALIEN_PARTS', 'XP', 'REP', 'CHARACTER');
ALTER TABLE "PackReward" ALTER COLUMN "type" TYPE "PackRewardType_new" USING ("type"::text::"PackRewardType_new");
ALTER TYPE "PackRewardType" RENAME TO "PackRewardType_old";
ALTER TYPE "PackRewardType_new" RENAME TO "PackRewardType";
DROP TYPE "PackRewardType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PackReward" DROP CONSTRAINT "PackReward_alienPartGroupId_fkey";

-- DropIndex
DROP INDEX "PackReward_alienPartGroupId_idx";

-- AlterTable
ALTER TABLE "PackReward" DROP COLUMN "alienPartGroupId";
