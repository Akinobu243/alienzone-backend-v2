/*
  Warnings:

  - You are about to drop the column `inRaid` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the column `onTeam` on the `Alien` table. All the data in the column will be lost.
  - You are about to drop the `UserCharacter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RaidHistoryToUserCharacter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserCharacter" DROP CONSTRAINT "UserCharacter_characterId_fkey";

-- DropForeignKey
ALTER TABLE "UserCharacter" DROP CONSTRAINT "UserCharacter_userId_fkey";

-- DropForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" DROP CONSTRAINT "_RaidHistoryToUserCharacter_A_fkey";

-- DropForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" DROP CONSTRAINT "_RaidHistoryToUserCharacter_B_fkey";

-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "inRaid",
DROP COLUMN "onTeam";

-- AlterTable
ALTER TABLE "RaidHistory" ADD COLUMN     "characterIds" INTEGER[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "raidAlienIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "raidCharacterIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "teamAlienIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "teamCharacterIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- DropTable
DROP TABLE "UserCharacter";

-- DropTable
DROP TABLE "_RaidHistoryToUserCharacter";
