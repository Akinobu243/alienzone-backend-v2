/*
  Warnings:

  - Added the required column `type` to the `CharacterTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CharacterTransaction" ADD COLUMN     "type" "CharacterTransactionType" NOT NULL;
