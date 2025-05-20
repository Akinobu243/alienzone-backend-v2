/*
  Warnings:

  - A unique constraint covering the columns `[tokenId]` on the table `Character` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Character_tokenId_key" ON "Character"("tokenId");
