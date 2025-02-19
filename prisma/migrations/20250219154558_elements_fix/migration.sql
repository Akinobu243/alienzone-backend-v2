/*
  Warnings:

  - You are about to drop the column `elementId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_elementId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "elementId";

-- CreateTable
CREATE TABLE "UserElement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "elementId" INTEGER NOT NULL,

    CONSTRAINT "UserElement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserElement" ADD CONSTRAINT "UserElement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserElement" ADD CONSTRAINT "UserElement_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "Element"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
