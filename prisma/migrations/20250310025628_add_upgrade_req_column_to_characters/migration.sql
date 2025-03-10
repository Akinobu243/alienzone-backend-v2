/*
  Warnings:

  - Added the required column `upgradeReq` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "upgradeReq" INTEGER NOT NULL;
