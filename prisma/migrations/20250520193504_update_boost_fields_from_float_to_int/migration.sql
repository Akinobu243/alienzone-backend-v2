/*
  Warnings:

  - You are about to alter the column `raidTimeBoost` on the `AlienPart` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `starBoost` on the `AlienPart` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `xpBoost` on the `AlienPart` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "AlienPart" ALTER COLUMN "raidTimeBoost" SET DEFAULT 0,
ALTER COLUMN "raidTimeBoost" SET DATA TYPE INTEGER,
ALTER COLUMN "starBoost" SET DEFAULT 0,
ALTER COLUMN "starBoost" SET DATA TYPE INTEGER,
ALTER COLUMN "xpBoost" SET DEFAULT 0,
ALTER COLUMN "xpBoost" SET DATA TYPE INTEGER;
