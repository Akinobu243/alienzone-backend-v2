-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "rarity" SET DEFAULT 'R';

-- CreateTable
CREATE TABLE "UnmintedCharacter" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnmintedCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnmintedCharacter_userId_characterId_idx" ON "UnmintedCharacter"("userId", "characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UnmintedCharacter_userId_characterId_key" ON "UnmintedCharacter"("userId", "characterId");

-- AddForeignKey
ALTER TABLE "UnmintedCharacter" ADD CONSTRAINT "UnmintedCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnmintedCharacter" ADD CONSTRAINT "UnmintedCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
