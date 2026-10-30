/*
  Warnings:

  - You are about to drop the column `action` on the `ticketevent` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `ticketevent` table. All the data in the column will be lost.
  - Added the required column `type` to the `TicketEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ticketevent` DROP COLUMN `action`,
    DROP COLUMN `details`,
    ADD COLUMN `newValue` VARCHAR(191) NULL,
    ADD COLUMN `oldValue` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;
