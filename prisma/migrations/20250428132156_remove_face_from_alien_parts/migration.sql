/*
  Warnings:

  - The values [FACE] on the enum `AlienPartType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlienPartType_new" AS ENUM ('BODY', 'CLOTHES', 'HEAD', 'EYES', 'MOUTH', 'HAIR', 'MARKS', 'POWERS', 'ACCESSORIES');
ALTER TABLE "AlienPart" ALTER COLUMN "type" TYPE "AlienPartType_new" USING ("type"::text::"AlienPartType_new");
ALTER TYPE "AlienPartType" RENAME TO "AlienPartType_old";
ALTER TYPE "AlienPartType_new" RENAME TO "AlienPartType";
DROP TYPE "AlienPartType_old";
COMMIT;
