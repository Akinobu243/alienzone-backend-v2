-- CreateTable
CREATE TABLE "UserCharacter" (
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,

    CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("userId","characterId")
);

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
