/*
  Warnings:

  - Changed the type of `element` on the `Alien` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `element` on the `Character` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Element" AS ENUM ('GAMMA', 'FIRE', 'LIFE', 'WATER', 'LOVE', 'GRAVITY', 'PLASMA', 'THUNDER');

-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "element",
ADD COLUMN     "element" "Element" NOT NULL;

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "element",
ADD COLUMN     "element" "Element" NOT NULL;
