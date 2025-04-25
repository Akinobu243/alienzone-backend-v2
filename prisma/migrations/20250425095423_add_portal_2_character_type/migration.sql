/*
  Warnings:

  - You are about to drop the column `isUsable` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Character" DROP COLUMN "isUsable",
ADD COLUMN     "isPortal2" BOOLEAN NOT NULL DEFAULT false;
