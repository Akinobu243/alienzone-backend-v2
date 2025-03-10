-- CreateTable
CREATE TABLE "MintTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MintTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MintTransaction_userId_idx" ON "MintTransaction"("userId");

-- CreateIndex
CREATE INDEX "MintTransaction_txHash_idx" ON "MintTransaction"("txHash");

-- AddForeignKey
ALTER TABLE "MintTransaction" ADD CONSTRAINT "MintTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MintTransaction" ADD CONSTRAINT "MintTransaction_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
