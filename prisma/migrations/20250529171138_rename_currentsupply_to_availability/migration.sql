/*
  Warnings:

  - You are about to drop the column `currentSupply` on the `Wearable` table. All the data in the column will be lost.
  - You are about to drop the column `currentSupplyInWei` on the `Wearable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wearable" DROP COLUMN "currentSupply",
DROP COLUMN "currentSupplyInWei",
ADD COLUMN     "availability" DOUBLE PRECISION,
ADD COLUMN     "availabilityInWei" TEXT;
