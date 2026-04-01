/*
  Warnings:

  - A unique constraint covering the columns `[orgCode]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgCode` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `organization` ADD COLUMN `orgCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Organization_orgCode_key` ON `Organization`(`orgCode`);
