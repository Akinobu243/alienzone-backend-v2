/*
  Warnings:

  - Added the required column `frequency` to the `Quest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "frequency" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UnmintedCharacter" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
