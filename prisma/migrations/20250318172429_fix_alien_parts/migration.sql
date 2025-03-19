/*
  Warnings:

  - You are about to drop the `_AlienPartGroupToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_AlienPartGroupToUser" DROP CONSTRAINT "_AlienPartGroupToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_AlienPartGroupToUser" DROP CONSTRAINT "_AlienPartGroupToUser_B_fkey";

-- AlterTable
ALTER TABLE "AlienPartGroup" ADD COLUMN     "userId" INTEGER;

-- DropTable
DROP TABLE "_AlienPartGroupToUser";

-- AddForeignKey
ALTER TABLE "AlienPartGroup" ADD CONSTRAINT "AlienPartGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
