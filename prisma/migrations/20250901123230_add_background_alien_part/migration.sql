-- AlterEnum
ALTER TYPE "AlienPartType" ADD VALUE 'BACKGROUND';

-- AlterTable
ALTER TABLE "Alien" ADD COLUMN     "backgroundId" INTEGER;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_backgroundId_fkey" FOREIGN KEY ("backgroundId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
