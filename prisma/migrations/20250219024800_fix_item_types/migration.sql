/*
  Warnings:

  - You are about to drop the column `name` on the `Item` table. All the data in the column will be lost.
  - Added the required column `quality` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('SHEARS', 'CUT', 'KNIFE');

-- CreateEnum
CREATE TYPE "ItemQuality" AS ENUM ('BRONZE', 'SILVER', 'GOLDEN');

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "name",
ADD COLUMN     "quality" "ItemQuality" NOT NULL,
ADD COLUMN     "type" "ItemType" NOT NULL;
