/*
  Warnings:

  - Added the required column `raidFinishTime` to the `RaidHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RaidHistory" ADD COLUMN     "raidFinishTime" TIMESTAMP(3) NOT NULL;
