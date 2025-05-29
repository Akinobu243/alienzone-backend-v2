/*
  Warnings:

  - You are about to drop the column `totalSupply` on the `Wearable` table. All the data in the column will be lost.
  - Added the required column `totalSupplyInWei` to the `Wearable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wearable" DROP COLUMN "totalSupply",
ADD COLUMN     "totalSupplyInWei" TEXT NOT NULL;
