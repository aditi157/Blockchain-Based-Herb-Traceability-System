-- AlterTable
ALTER TABLE `manufacturingbatch` ADD COLUMN `batchName` VARCHAR(191) NULL,
    ADD COLUMN `expiryDate` DATETIME(3) NULL,
    ADD COLUMN `finalProductQuantity` INTEGER NULL,
    ADD COLUMN `herbUsedQuantity` INTEGER NULL;
