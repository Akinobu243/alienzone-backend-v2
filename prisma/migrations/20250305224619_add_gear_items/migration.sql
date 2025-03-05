-- CreateEnum
CREATE TYPE "GearItemRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE');



-- CreateTable
CREATE TABLE "GearItem" (
    "id" SERIAL NOT NULL,
    "rarity" "GearItemRarity" NOT NULL,
    "image" TEXT NOT NULL,
    "summonedCharacterId" INTEGER,

    CONSTRAINT "GearItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGearItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gearItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "UserGearItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGearItem_userId_gearItemId_idx" ON "UserGearItem"("userId", "gearItemId");

-- AddForeignKey
ALTER TABLE "GearItem" ADD CONSTRAINT "GearItem_summonedCharacterId_fkey" FOREIGN KEY ("summonedCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGearItem" ADD CONSTRAINT "UserGearItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGearItem" ADD CONSTRAINT "UserGearItem_gearItemId_fkey" FOREIGN KEY ("gearItemId") REFERENCES "GearItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
