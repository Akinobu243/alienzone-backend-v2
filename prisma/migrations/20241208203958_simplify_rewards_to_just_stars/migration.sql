/*
  Warnings:

  - The values [CASH] on the enum `RewardType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Currency` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `stars` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RewardType_new" AS ENUM ('STARS', 'XP', 'REP');
ALTER TABLE "RaidReward" ALTER COLUMN "type" TYPE "RewardType_new" USING ("type"::text::"RewardType_new");
ALTER TYPE "RewardType" RENAME TO "RewardType_old";
ALTER TYPE "RewardType_new" RENAME TO "RewardType";
DROP TYPE "RewardType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Currency" DROP CONSTRAINT "Currency_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stars" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Currency";

-- DropEnum
DROP TYPE "CurrencyType";
