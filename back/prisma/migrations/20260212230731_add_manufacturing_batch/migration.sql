-- AlterTable
ALTER TABLE `collection` ADD COLUMN `location` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ManufacturingBatch` (
    `id` VARCHAR(191) NOT NULL,
    `batchCode` VARCHAR(191) NOT NULL,
    `labResultId` VARCHAR(191) NOT NULL,
    `canonicalData` LONGTEXT NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `signature` LONGTEXT NOT NULL,
    `manufacturerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ManufacturingBatch_batchCode_key`(`batchCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LabResult` ADD CONSTRAINT `LabResult_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `Collection`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManufacturingBatch` ADD CONSTRAINT `ManufacturingBatch_manufacturerId_fkey` FOREIGN KEY (`manufacturerId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManufacturingBatch` ADD CONSTRAINT `ManufacturingBatch_labResultId_fkey` FOREIGN KEY (`labResultId`) REFERENCES `LabResult`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
