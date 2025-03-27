-- AlterTable
ALTER TABLE "Alien" ADD COLUMN     "accessoriesId" INTEGER,
ADD COLUMN     "bodyId" INTEGER,
ADD COLUMN     "clothesId" INTEGER,
ADD COLUMN     "eyesId" INTEGER,
ADD COLUMN     "faceId" INTEGER,
ADD COLUMN     "hairId" INTEGER,
ADD COLUMN     "headId" INTEGER,
ADD COLUMN     "marksId" INTEGER,
ADD COLUMN     "mouthId" INTEGER,
ADD COLUMN     "powersId" INTEGER;

-- AlterTable
ALTER TABLE "AlienPartGroup" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ReferralReward" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_clothesId_fkey" FOREIGN KEY ("clothesId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_headId_fkey" FOREIGN KEY ("headId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_eyesId_fkey" FOREIGN KEY ("eyesId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_mouthId_fkey" FOREIGN KEY ("mouthId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_hairId_fkey" FOREIGN KEY ("hairId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_marksId_fkey" FOREIGN KEY ("marksId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_powersId_fkey" FOREIGN KEY ("powersId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_accessoriesId_fkey" FOREIGN KEY ("accessoriesId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_faceId_fkey" FOREIGN KEY ("faceId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
