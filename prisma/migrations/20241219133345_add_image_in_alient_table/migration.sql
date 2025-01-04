/*
  Warnings:

  - You are about to drop the column `eyes` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the column `face` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the column `hair` on the `Alien` table. All the data in the column will be lost.
  - Added the required column `image` to the `Alien` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "eyes",
DROP COLUMN "face",
DROP COLUMN "hair",
ADD COLUMN     "image" TEXT NOT NULL;
