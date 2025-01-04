-- CreateTable
CREATE TABLE "_RaidHistoryToUserCharacter" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RaidHistoryToUserCharacter_AB_unique" ON "_RaidHistoryToUserCharacter"("A", "B");

-- CreateIndex
CREATE INDEX "_RaidHistoryToUserCharacter_B_index" ON "_RaidHistoryToUserCharacter"("B");

-- AddForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" ADD CONSTRAINT "_RaidHistoryToUserCharacter_A_fkey" FOREIGN KEY ("A") REFERENCES "RaidHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" ADD CONSTRAINT "_RaidHistoryToUserCharacter_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
