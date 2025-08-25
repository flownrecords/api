-- DropForeignKey
ALTER TABLE "FlightRecording" DROP CONSTRAINT "FlightRecording_logbookEntryId_fkey";

-- AlterTable
ALTER TABLE "FlightRecording" ALTER COLUMN "logbookEntryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "FlightRecording" ADD CONSTRAINT "FlightRecording_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "LogbookEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
