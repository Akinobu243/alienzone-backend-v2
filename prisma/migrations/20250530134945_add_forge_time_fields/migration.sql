-- AlterTable
ALTER TABLE "AlienPart" ADD COLUMN     "forgeTime" INTEGER NOT NULL DEFAULT 300,
ADD COLUMN     "userForgeTime" JSONB DEFAULT '[]';
