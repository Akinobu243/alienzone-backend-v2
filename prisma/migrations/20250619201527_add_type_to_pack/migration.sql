-- CreateEnum
CREATE TYPE "PackType" AS ENUM ('SPECIAL', 'STARS');

-- AlterTable
ALTER TABLE "Pack" ADD COLUMN     "type" "PackType" NOT NULL DEFAULT 'SPECIAL';
