-- AlterTable
ALTER TABLE `collection` ADD COLUMN `blockchainHash` VARCHAR(191) NULL,
    ADD COLUMN `txHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `labresult` ADD COLUMN `blockchainHash` VARCHAR(191) NULL,
    ADD COLUMN `txHash` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `manufacturingbatch` ADD COLUMN `blockchainHash` VARCHAR(191) NULL,
    ADD COLUMN `txHash` VARCHAR(191) NULL,
    MODIFY `qrCode` TEXT NULL;
