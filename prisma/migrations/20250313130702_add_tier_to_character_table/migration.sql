/*
  Warnings:

  - You are about to drop the column `icon` on the `Raid` table. All the data in the column will be lost.
  - Added the required column `tier` to the `Character` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "tier" INTEGER NOT NULL;