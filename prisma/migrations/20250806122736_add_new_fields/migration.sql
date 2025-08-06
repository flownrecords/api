/*
  Warnings:

  - You are about to drop the column `data` on the `FlightRecording` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `FlightRecording` table. All the data in the column will be lost.
  - Added the required column `name` to the `FlightRecording` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FlightRecording" DROP COLUMN "data",
DROP COLUMN "fileName",
ADD COLUMN     "coords" JSONB[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
