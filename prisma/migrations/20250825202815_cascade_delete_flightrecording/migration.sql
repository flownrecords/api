/*
  Warnings:

  - You are about to drop the column `organizationJoinedAt` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FlightRecording" DROP CONSTRAINT "FlightRecording_logbookEntryId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "organizationJoinedAt";

-- AddForeignKey
ALTER TABLE "FlightRecording" ADD CONSTRAINT "FlightRecording_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
