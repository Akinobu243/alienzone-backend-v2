/*
  Warnings:

  - You are about to drop the column `faceId` on the `Alien` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Alien" DROP CONSTRAINT "Alien_faceId_fkey";

-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "faceId";
