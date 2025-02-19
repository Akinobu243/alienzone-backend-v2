/*
  Warnings:

  - You are about to drop the column `elementId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `packId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_elementId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "elementId",
DROP COLUMN "packId";

-- CreateTable
CREATE TABLE "_ElementToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ElementToUser_AB_unique" ON "_ElementToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ElementToUser_B_index" ON "_ElementToUser"("B");

-- AddForeignKey
ALTER TABLE "_ElementToUser" ADD CONSTRAINT "_ElementToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Element"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ElementToUser" ADD CONSTRAINT "_ElementToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
