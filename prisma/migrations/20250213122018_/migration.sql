-- AlterEnum
ALTER TYPE "PackRewardType" ADD VALUE 'ELEMENT';

-- AlterTable
ALTER TABLE "PackReward" ADD COLUMN     "characterId" INTEGER,
ADD COLUMN     "elementId" INTEGER;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
