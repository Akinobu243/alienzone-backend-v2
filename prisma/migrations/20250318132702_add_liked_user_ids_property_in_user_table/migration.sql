-- AlterTable
ALTER TABLE "User" ADD COLUMN     "likedUserIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
