/*
  Warnings:

  - You are about to drop the `MintTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MintTransaction" DROP CONSTRAINT "MintTransaction_characterId_fkey";

-- DropForeignKey
ALTER TABLE "MintTransaction" DROP CONSTRAINT "MintTransaction_userId_fkey";

-- DropTable
DROP TABLE "MintTransaction";

-- CreateTable
CREATE TABLE "CharacterTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "txHash" TEXT,
    "userWallet" TEXT NOT NULL,
    "serverSignature" TEXT NOT NULL,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterTransaction_userId_idx" ON "CharacterTransaction"("userId");

-- CreateIndex
CREATE INDEX "CharacterTransaction_txHash_idx" ON "CharacterTransaction"("txHash");

-- AddForeignKey
ALTER TABLE "CharacterTransaction" ADD CONSTRAINT "CharacterTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTransaction" ADD CONSTRAINT "CharacterTransaction_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
