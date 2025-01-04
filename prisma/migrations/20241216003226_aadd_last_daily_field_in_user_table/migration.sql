/*
  Warnings:

  - Added the required column `lastDaily` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastDaily" TIMESTAMP(3) NOT NULL;
