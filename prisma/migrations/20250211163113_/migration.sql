/*
  Warnings:

  - You are about to drop the column `alienPartGroupId` on the `AlienPart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlienPart" DROP CONSTRAINT "AlienPart_alienPartGroupId_fkey";

-- AlterTable
ALTER TABLE "AlienPart" DROP COLUMN "alienPartGroupId";

-- CreateTable
CREATE TABLE "_AlienPartToAlienPartGroup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToAlienPartGroup_AB_unique" ON "_AlienPartToAlienPartGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToAlienPartGroup_B_index" ON "_AlienPartToAlienPartGroup"("B");

-- AddForeignKey
ALTER TABLE "_AlienPartToAlienPartGroup" ADD CONSTRAINT "_AlienPartToAlienPartGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToAlienPartGroup" ADD CONSTRAINT "_AlienPartToAlienPartGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "AlienPartGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
