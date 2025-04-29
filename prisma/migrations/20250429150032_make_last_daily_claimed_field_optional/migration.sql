-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastDailyClaimed" DROP NOT NULL,
ALTER COLUMN "lastDailyClaimed" DROP DEFAULT;
