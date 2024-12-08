/*
  Warnings:

  - You are about to drop the column `userWalletAddress` on the `Alien` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Alien` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Alien" DROP COLUMN "userWalletAddress",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
