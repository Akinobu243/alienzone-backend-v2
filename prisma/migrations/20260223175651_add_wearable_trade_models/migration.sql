-- CreateTable
CREATE TABLE "WearableTrade" (
    "traderWallet" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "isBuy" BOOLEAN NOT NULL,
    "wearableAmount" TEXT NOT NULL,
    "zoneAmountSummary" TEXT NOT NULL,
    "transactionHash" VARCHAR(66) NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "logIndex" INTEGER NOT NULL,

    CONSTRAINT "WearableTrade_pkey" PRIMARY KEY ("transactionHash","logIndex")
);

-- CreateTable
CREATE TABLE "WearableTradeTrackerState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lastProcessedBlock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WearableTradeTrackerState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WearableTrade_subject_idx" ON "WearableTrade"("subject");

-- CreateIndex
CREATE INDEX "WearableTrade_traderWallet_blockNumber_logIndex_idx" ON "WearableTrade"("traderWallet", "blockNumber", "logIndex");

-- CreateIndex
CREATE INDEX "WearableTrade_traderWallet_subject_blockNumber_logIndex_idx" ON "WearableTrade"("traderWallet", "subject", "blockNumber", "logIndex");
