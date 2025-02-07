-- CreateEnum
CREATE TYPE "AlienPartType" AS ENUM ('BODY', 'CLOTHES', 'HEAD', 'FACE', 'HAIR');

-- CreateEnum
CREATE TYPE "PackRewardType" AS ENUM ('STARS', 'ALIEN_PART', 'XP', 'REP');

-- CreateTable
CREATE TABLE "UserAlienPart" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "alienPartId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAlienPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlienPart" (
    "id" SERIAL NOT NULL,
    "type" "AlienPartType" NOT NULL,
    "image" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlienPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pack" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "price" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackReward" (
    "id" SERIAL NOT NULL,
    "packId" INTEGER NOT NULL,
    "type" "PackRewardType" NOT NULL,
    "amount" INTEGER,
    "alienPartId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAlienPart_userId_alienPartId_idx" ON "UserAlienPart"("userId", "alienPartId");

-- CreateIndex
CREATE INDEX "PackReward_packId_idx" ON "PackReward"("packId");

-- CreateIndex
CREATE INDEX "PackReward_alienPartId_idx" ON "PackReward"("alienPartId");

-- AddForeignKey
ALTER TABLE "UserAlienPart" ADD CONSTRAINT "UserAlienPart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAlienPart" ADD CONSTRAINT "UserAlienPart_alienPartId_fkey" FOREIGN KEY ("alienPartId") REFERENCES "AlienPart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_alienPartId_fkey" FOREIGN KEY ("alienPartId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
