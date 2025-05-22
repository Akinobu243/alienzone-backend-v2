/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `AlienPart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AlienPart" ADD COLUMN     "hash" TEXT;

-- CreateTable
CREATE TABLE "Wearable" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "totalSupply" INTEGER NOT NULL,
    "alienPartId" INTEGER,

    CONSTRAINT "Wearable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wearable_subject_key" ON "Wearable"("subject");

-- CreateIndex
CREATE INDEX "Wearable_alienPartId_idx" ON "Wearable"("alienPartId");

-- CreateIndex
CREATE UNIQUE INDEX "AlienPart_hash_key" ON "AlienPart"("hash");

-- AddForeignKey
ALTER TABLE "Wearable" ADD CONSTRAINT "Wearable_alienPartId_fkey" FOREIGN KEY ("alienPartId") REFERENCES "AlienPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
