/*
  Warnings:

  - Added the required column `type` to the `GearItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GearItemType" AS ENUM ('DANTE', 'TWINS', 'TEMBIN', 'NIKOLA', 'KARUSHI', 'SHISHI');

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "isUsable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "GearItem" ADD COLUMN     "type" "GearItemType" NOT NULL;
