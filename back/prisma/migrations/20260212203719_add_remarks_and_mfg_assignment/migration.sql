-- AlterTable
ALTER TABLE `labresult` ADD COLUMN `assignedMfgId` VARCHAR(191) NULL,
    ADD COLUMN `remarks` LONGTEXT NULL;

-- AddForeignKey
ALTER TABLE `LabResult` ADD CONSTRAINT `LabResult_assignedMfgId_fkey` FOREIGN KEY (`assignedMfgId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
