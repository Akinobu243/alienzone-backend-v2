-- CreateTable
CREATE TABLE "_AlienPartGroupToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartGroupToUser_AB_unique" ON "_AlienPartGroupToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartGroupToUser_B_index" ON "_AlienPartGroupToUser"("B");

-- AddForeignKey
ALTER TABLE "_AlienPartGroupToUser" ADD CONSTRAINT "_AlienPartGroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPartGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartGroupToUser" ADD CONSTRAINT "_AlienPartGroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
