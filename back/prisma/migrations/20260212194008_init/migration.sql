-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('FARMER', 'LAB', 'MANUFACTURER', 'CONSUMER') NOT NULL,
    `publicKey` LONGTEXT NOT NULL,
    `privateKey` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Organization_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Collection` (
    `id` VARCHAR(191) NOT NULL,
    `herbName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `canonicalData` LONGTEXT NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `signature` LONGTEXT NOT NULL,
    `farmerId` VARCHAR(191) NOT NULL,
    `assignedLabId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabResult` (
    `id` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NOT NULL,
    `canonicalData` LONGTEXT NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `signature` LONGTEXT NOT NULL,
    `labId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Collection` ADD CONSTRAINT `Collection_farmerId_fkey` FOREIGN KEY (`farmerId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabResult` ADD CONSTRAINT `LabResult_labId_fkey` FOREIGN KEY (`labId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
