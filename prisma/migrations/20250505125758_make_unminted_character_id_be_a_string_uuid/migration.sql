/*
  Warnings:

  - The primary key for the `UnmintedCharacter` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UnmintedCharacter" DROP CONSTRAINT "UnmintedCharacter_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UnmintedCharacter_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UnmintedCharacter_id_seq";
