-- AlterTable
ALTER TABLE "User" ADD COLUMN     "characterIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
