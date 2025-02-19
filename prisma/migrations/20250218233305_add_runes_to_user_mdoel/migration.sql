-- CreateEnum
CREATE TYPE "RuneType" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "runes" "RuneType"[];
