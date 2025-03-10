/*
  Warnings:

  - Added the required column `tokenId` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "tokenId" INTEGER NOT NULL;
