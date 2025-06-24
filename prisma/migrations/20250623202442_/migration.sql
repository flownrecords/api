/*
  Warnings:

  - You are about to drop the column `flightTrack` on the `logbook` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "logbook" DROP COLUMN "flightTrack",
ADD COLUMN     "recording" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- CreateTable
CREATE TABLE "FlightPlan" (
    "id" SERIAL NOT NULL,
    "depAd" TEXT NOT NULL,
    "arrAd" TEXT NOT NULL,
    "route" TEXT,
    "alternate" TEXT,
    "cruiseLevel" TEXT,
    "cruiseSpeed" TEXT,
    "fuelPlan" DECIMAL(65,30),
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "remarks" TEXT,
    "weather" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logbookEntryId" INTEGER NOT NULL,

    CONSTRAINT "FlightPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightPlan_logbookEntryId_key" ON "FlightPlan"("logbookEntryId");

-- AddForeignKey
ALTER TABLE "FlightPlan" ADD CONSTRAINT "FlightPlan_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "logbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
