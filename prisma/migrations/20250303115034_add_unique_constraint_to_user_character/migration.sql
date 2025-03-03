/*
  Warnings:

  - A unique constraint covering the columns `[userId,characterId]` on the table `UserCharacter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserCharacter_userId_characterId_key" ON "UserCharacter"("userId", "characterId");
