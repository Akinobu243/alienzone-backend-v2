/*
  Warnings:

  - You are about to drop the column `element` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the column `element` on the `AlienPartGroup` table. All the data in the column will be lost.
  - You are about to drop the column `element` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `element` on the `PackReward` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Raid` table. All the data in the column will be lost.
  - Added the required column `elementId` to the `Alien` table without a default value. This is not possible if the table is not empty.
  - Added the required column `elementId` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `elementId` to the `Raid` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('GAMMA', 'FIRE', 'LIFE', 'WATER', 'LOVE', 'GRAVITY', 'PLASMA', 'THUNDER');

-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "element",
ADD COLUMN     "elementId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "AlienPartGroup" DROP COLUMN "element",
ADD COLUMN     "elementId" INTEGER;

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "element",
ADD COLUMN     "elementId" INTEGER NOT NULL,
ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PackReward" DROP COLUMN "element",
ADD COLUMN     "elementId" INTEGER;

-- AlterTable
ALTER TABLE "Raid" DROP COLUMN "type",
ADD COLUMN     "elementId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "elementId" INTEGER;

-- DropEnum
DROP TYPE "CharacterType";

-- DropEnum
DROP TYPE "Element";

-- CreateTable
CREATE TABLE "Element" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "background" TEXT,
    "weaknessId" INTEGER,
    "strengthId" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Raid" ADD CONSTRAINT "Raid_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_weaknessId_fkey" FOREIGN KEY ("weaknessId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_strengthId_fkey" FOREIGN KEY ("strengthId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlienPartGroup" ADD CONSTRAINT "AlienPartGroup_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;
