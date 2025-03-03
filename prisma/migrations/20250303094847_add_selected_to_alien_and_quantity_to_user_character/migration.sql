-- AlterTable
ALTER TABLE "Alien" ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserCharacter" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
