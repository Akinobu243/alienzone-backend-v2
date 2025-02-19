/*
  Warnings:

  - Added the required column `type` to the `Raid` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Raid" ADD COLUMN     "type" "Element" NOT NULL;
