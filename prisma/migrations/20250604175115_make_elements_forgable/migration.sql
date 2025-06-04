-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "forgeRuneAmount" INTEGER,
ADD COLUMN     "forgeRuneType" "RuneType",
ADD COLUMN     "isForgeable" BOOLEAN NOT NULL DEFAULT false;
