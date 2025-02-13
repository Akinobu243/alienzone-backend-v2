/*
  Warnings:

  - You are about to drop the column `alienPartId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_alienPartId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "alienPartId";

-- CreateTable
CREATE TABLE "_AlienPartToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToUser_AB_unique" ON "_AlienPartToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToUser_B_index" ON "_AlienPartToUser"("B");

-- AddForeignKey
ALTER TABLE "_AlienPartToUser" ADD CONSTRAINT "_AlienPartToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToUser" ADD CONSTRAINT "_AlienPartToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
