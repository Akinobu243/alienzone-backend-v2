-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('STARS', 'XP');

-- CreateEnum
CREATE TYPE "DailyRewardType" AS ENUM ('ITEM', 'STARS', 'XP');

-- CreateEnum
CREATE TYPE "RuneType" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PACK', 'ALIEN_PART', 'STARS', 'XP', 'REP');

-- CreateEnum
CREATE TYPE "Element" AS ENUM ('GAMMA', 'FIRE', 'LIFE', 'WATER', 'LOVE', 'GRAVITY', 'PLASMA', 'THUNDER');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SHEARS', 'CUT', 'KNIFE');

-- CreateEnum
CREATE TYPE "ItemQuality" AS ENUM ('BRONZE', 'SILVER', 'GOLDEN');

-- CreateEnum
CREATE TYPE "CharacterType" AS ENUM ('FIRE', 'WATER', 'THUNDER');

-- CreateEnum
CREATE TYPE "CharacterRarity" AS ENUM ('SR');

-- CreateEnum
CREATE TYPE "AlienPartType" AS ENUM ('BODY', 'CLOTHES', 'HEAD', 'EYES', 'MOUTH', 'HAIR', 'MARKS', 'POWERS', 'ACCESSORIES', 'FACE');

-- CreateEnum
CREATE TYPE "PackRewardType" AS ENUM ('STARS', 'ALIEN_PARTS', 'XP', 'REP', 'CHARACTER', 'ELEMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "twitterId" TEXT NOT NULL,
    "enterprise" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referrerId" INTEGER,
    "image" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL,
    "reputation" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "runes" "RuneType"[],
    "starsBoost" INTEGER NOT NULL DEFAULT 0,
    "raidTimeBoost" INTEGER NOT NULL DEFAULT 0,
    "xpBoost" INTEGER NOT NULL DEFAULT 0,
    "lastStarBoost" TIMESTAMP(3),
    "lastRaidBoost" TIMESTAMP(3),
    "lastXpBoost" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'USER',
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyClaimed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raid" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "icon" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "type" "Element" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Raid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaidReward" (
    "id" SERIAL NOT NULL,
    "type" "RewardType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaidReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaidHistory" (
    "id" SERIAL NOT NULL,
    "raidId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "inProgress" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaidHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alien" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "image" TEXT,
    "strengthPoints" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "inRaid" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "element" "Element" NOT NULL,
    "power" INTEGER NOT NULL,
    "rarity" "CharacterRarity" NOT NULL DEFAULT 'SR',
    "image" TEXT NOT NULL,
    "portal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCharacter" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "inRaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "type" "ItemType" NOT NULL,
    "quality" "ItemQuality" NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserItem" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "UserItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyReward" (
    "id" SERIAL NOT NULL,
    "type" "DailyRewardType" NOT NULL,
    "itemId" INTEGER,
    "amount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "refereeId" INTEGER NOT NULL,
    "starsEarned" INTEGER NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "AlienPartGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "element" "Element",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlienPartGroup_pkey" PRIMARY KEY ("id")
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
    "element" "Element",
    "characterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentId" TEXT,
    "packId" INTEGER,
    "alienPartId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RaidToRaidReward" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_RaidHistoryToUserCharacter" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AlienToRaidHistory" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AlienPartToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AlienPartToPackReward" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_AlienPartToAlienPartGroup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PurchasedPacks" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "RaidHistory_raidId_userId_idx" ON "RaidHistory"("raidId", "userId");

-- CreateIndex
CREATE INDEX "UserCharacter_userId_characterId_idx" ON "UserCharacter"("userId", "characterId");

-- CreateIndex
CREATE INDEX "UserItem_userId_itemId_idx" ON "UserItem"("userId", "itemId");

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_idx" ON "ReferralReward"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralReward_refereeId_idx" ON "ReferralReward"("refereeId");

-- CreateIndex
CREATE INDEX "PackReward_packId_idx" ON "PackReward"("packId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_stripePaymentId_idx" ON "Transaction"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "_RaidToRaidReward_AB_unique" ON "_RaidToRaidReward"("A", "B");

-- CreateIndex
CREATE INDEX "_RaidToRaidReward_B_index" ON "_RaidToRaidReward"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RaidHistoryToUserCharacter_AB_unique" ON "_RaidHistoryToUserCharacter"("A", "B");

-- CreateIndex
CREATE INDEX "_RaidHistoryToUserCharacter_B_index" ON "_RaidHistoryToUserCharacter"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlienToRaidHistory_AB_unique" ON "_AlienToRaidHistory"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienToRaidHistory_B_index" ON "_AlienToRaidHistory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToUser_AB_unique" ON "_AlienPartToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToUser_B_index" ON "_AlienPartToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToPackReward_AB_unique" ON "_AlienPartToPackReward"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToPackReward_B_index" ON "_AlienPartToPackReward"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AlienPartToAlienPartGroup_AB_unique" ON "_AlienPartToAlienPartGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_AlienPartToAlienPartGroup_B_index" ON "_AlienPartToAlienPartGroup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PurchasedPacks_AB_unique" ON "_PurchasedPacks"("A", "B");

-- CreateIndex
CREATE INDEX "_PurchasedPacks_B_index" ON "_PurchasedPacks"("B");

-- AddForeignKey
ALTER TABLE "RaidHistory" ADD CONSTRAINT "RaidHistory_raidId_fkey" FOREIGN KEY ("raidId") REFERENCES "Raid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaidHistory" ADD CONSTRAINT "RaidHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alien" ADD CONSTRAINT "Alien_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCharacter" ADD CONSTRAINT "UserCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReward" ADD CONSTRAINT "DailyReward_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackReward" ADD CONSTRAINT "PackReward_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_packId_fkey" FOREIGN KEY ("packId") REFERENCES "Pack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_alienPartId_fkey" FOREIGN KEY ("alienPartId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidToRaidReward" ADD CONSTRAINT "_RaidToRaidReward_A_fkey" FOREIGN KEY ("A") REFERENCES "Raid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidToRaidReward" ADD CONSTRAINT "_RaidToRaidReward_B_fkey" FOREIGN KEY ("B") REFERENCES "RaidReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" ADD CONSTRAINT "_RaidHistoryToUserCharacter_A_fkey" FOREIGN KEY ("A") REFERENCES "RaidHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RaidHistoryToUserCharacter" ADD CONSTRAINT "_RaidHistoryToUserCharacter_B_fkey" FOREIGN KEY ("B") REFERENCES "UserCharacter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienToRaidHistory" ADD CONSTRAINT "_AlienToRaidHistory_A_fkey" FOREIGN KEY ("A") REFERENCES "Alien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienToRaidHistory" ADD CONSTRAINT "_AlienToRaidHistory_B_fkey" FOREIGN KEY ("B") REFERENCES "RaidHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToUser" ADD CONSTRAINT "_AlienPartToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToUser" ADD CONSTRAINT "_AlienPartToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToPackReward" ADD CONSTRAINT "_AlienPartToPackReward_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToPackReward" ADD CONSTRAINT "_AlienPartToPackReward_B_fkey" FOREIGN KEY ("B") REFERENCES "PackReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToAlienPartGroup" ADD CONSTRAINT "_AlienPartToAlienPartGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "AlienPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlienPartToAlienPartGroup" ADD CONSTRAINT "_AlienPartToAlienPartGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "AlienPartGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PurchasedPacks" ADD CONSTRAINT "_PurchasedPacks_A_fkey" FOREIGN KEY ("A") REFERENCES "Pack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PurchasedPacks" ADD CONSTRAINT "_PurchasedPacks_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
