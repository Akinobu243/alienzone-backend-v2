/*
  Warnings:

  - The primary key for the `UserCharacter` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UserCharacter" DROP CONSTRAINT "UserCharacter_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "UserCharacter_userId_characterId_idx" ON "UserCharacter"("userId", "characterId");
