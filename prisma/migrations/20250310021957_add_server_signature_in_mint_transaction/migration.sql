/*
  Warnings:

  - Added the required column `serverSignature` to the `MintTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MintTransaction" ADD COLUMN     "serverSignature" TEXT NOT NULL;
