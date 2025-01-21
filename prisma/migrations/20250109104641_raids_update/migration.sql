/*
  Warnings:

  - Added the required column `icon` to the `Raid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Raid` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Raid" ADD COLUMN     "icon" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "level" SET DEFAULT 1;
