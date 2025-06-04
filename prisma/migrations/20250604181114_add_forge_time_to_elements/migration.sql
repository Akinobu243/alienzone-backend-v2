-- AlterTable
ALTER TABLE "Element" ADD COLUMN     "forgeTime" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "userForgeTime" JSONB DEFAULT '[]';
