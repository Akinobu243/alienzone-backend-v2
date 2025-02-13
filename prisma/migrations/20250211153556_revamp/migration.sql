/*
  Warnings:

  - The values [FACE] on the enum `AlienPartType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `element` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the column `element` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `strengthPoints` on the `Character` table. All the data in the column will be lost.
  - Added the required column `power` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Character` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserCharacter` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CharacterType" AS ENUM ('FIRE', 'WATER', 'THUNDER');

-- CreateEnum
CREATE TYPE "CharacterRarity" AS ENUM ('SR');

-- AlterEnum
BEGIN;
CREATE TYPE "AlienPartType_new" AS ENUM ('BODY', 'CLOTHES', 'HEAD', 'EYES', 'MOUTH', 'HAIR', 'MARKS', 'POWERS', 'ACCESSORIES');
ALTER TABLE "AlienPart" ALTER COLUMN "type" TYPE "AlienPartType_new" USING ("type"::text::"AlienPartType_new");
ALTER TYPE "AlienPartType" RENAME TO "AlienPartType_old";
ALTER TYPE "AlienPartType_new" RENAME TO "AlienPartType";
DROP TYPE "AlienPartType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PackRewardType" ADD VALUE 'CHARACTER';

-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "element",
ADD COLUMN     "elementId" INTEGER;

-- AlterTable
ALTER TABLE "AlienPart" ADD COLUMN     "alienPartGroupId" INTEGER;

-- AlterTable
ALTER TABLE "Character" DROP COLUMN "element",
DROP COLUMN "level",
DROP COLUMN "strengthPoints",
ADD COLUMN     "power" INTEGER NOT NULL,
ADD COLUMN     "rarity" "CharacterRarity" NOT NULL DEFAULT 'SR',
ADD COLUMN     "type" "CharacterType" NOT NULL,
ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserCharacter" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Element" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "background" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlienPartGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "elementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlienPartGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlienPart" ADD CONSTRAINT "AlienPart_alienPartGroupId_fkey" FOREIGN KEY ("alienPartGroupId") REFERENCES "AlienPartGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlienPartGroup" ADD CONSTRAINT "AlienPartGroup_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;
