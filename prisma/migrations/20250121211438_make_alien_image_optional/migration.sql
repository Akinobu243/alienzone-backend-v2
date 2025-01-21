/*
  Warnings:

  - Made the column `image` on table `Character` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Alien" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "image" SET NOT NULL;
