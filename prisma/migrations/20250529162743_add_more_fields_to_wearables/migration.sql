/*
  Warnings:

  - Added the required column `totalSupply` to the `Wearable` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Wearable" ADD COLUMN     "buyPrice" DOUBLE PRECISION,
ADD COLUMN     "buyPriceInWei" TEXT,
ADD COLUMN     "sellPrice" DOUBLE PRECISION,
ADD COLUMN     "sellPriceInWei" TEXT,
ADD COLUMN     "totalSupply" DOUBLE PRECISION NOT NULL;
