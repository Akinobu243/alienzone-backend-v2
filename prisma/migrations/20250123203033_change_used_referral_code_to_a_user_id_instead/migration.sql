/*
  Warnings:

  - You are about to drop the column `usedReferralCode` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "usedReferralCode",
ADD COLUMN     "referrerId" INTEGER;
