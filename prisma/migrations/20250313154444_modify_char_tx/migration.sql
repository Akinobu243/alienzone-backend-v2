/*
  Warnings:

  - You are about to drop the column `characterId` on the `CharacterTransaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CharacterTransaction" DROP CONSTRAINT "CharacterTransaction_characterId_fkey";

-- AlterTable
ALTER TABLE "CharacterTransaction" DROP COLUMN "characterId",
ADD COLUMN     "characterIds" INTEGER[];
