/*
  Warnings:

  - You are about to drop the `UserAlienPart` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserAlienPart" DROP CONSTRAINT "UserAlienPart_alienPartId_fkey";

-- DropForeignKey
ALTER TABLE "UserAlienPart" DROP CONSTRAINT "UserAlienPart_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alienPartId" INTEGER,
ADD COLUMN     "elementId" INTEGER,
ADD COLUMN     "packId" INTEGER;

-- DropTable
DROP TABLE "UserAlienPart";

-- CreateTable
CREATE TABLE "_PurchasedPacks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PurchasedPacks_AB_unique" ON "_PurchasedPacks"("A", "B");

-- CreateIndex
CREATE INDEX "_PurchasedPacks_B_index" ON "_PurchasedPacks"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_alienPartId_fkey" FOREIGN KEY ("alienPartId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PurchasedPacks" ADD CONSTRAINT "_PurchasedPacks_A_fkey" FOREIGN KEY ("A") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PurchasedPacks" ADD CONSTRAINT "_PurchasedPacks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
