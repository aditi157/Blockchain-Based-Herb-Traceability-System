/*
  Warnings:

  - Added the required column `canonicalTimestamp` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canonicalTimestamp` to the `LabResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canonicalTimestamp` to the `ManufacturingBatch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `collection` ADD COLUMN `canonicalTimestamp` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `labresult` ADD COLUMN `canonicalTimestamp` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `manufacturingbatch` ADD COLUMN `canonicalTimestamp` VARCHAR(191) NOT NULL;
