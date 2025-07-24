-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL', 'COMPANY', 'COMMUNITY', 'CLUB', 'OTHER');

-- CreateEnum
CREATE TYPE "UserOrganizationRole" AS ENUM ('GUEST', 'STUDENT', 'PILOT', 'OPS', 'FI', 'TKI', 'MAIN', 'OFFICE', 'SUPERVISOR', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "UserPermission" AS ENUM ('USER', 'SUPPORT', 'QUESTIONS_MANAGER', 'FPL_MANAGER', 'LOGBOOK_MANAGER', 'MANAGER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthday" TIMESTAMP(3),
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePictureUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "homeAirport" TEXT,
    "permissions" "UserPermission"[],
    "organizationId" TEXT,
    "organizationRole" "UserOrganizationRole" NOT NULL DEFAULT 'GUEST',
    "organizationJoinedAt" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'EN',
    "publicProfile" BOOLEAN NOT NULL DEFAULT true,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookEntry" (
    "id" SERIAL NOT NULL,
    "unique" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3),
    "depAd" TEXT,
    "arrAd" TEXT,
    "offBlock" TIMESTAMP(3),
    "onBlock" TIMESTAMP(3),
    "aircraftType" TEXT,
    "aircraftRegistration" TEXT,
    "picName" TEXT,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sepVfr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sepIfr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meVfr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "meIfr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "picTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "copilotTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multiPilotTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instructorTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dualTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "simTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "simInstructorTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "landDay" INTEGER NOT NULL DEFAULT 0,
    "landNight" INTEGER NOT NULL DEFAULT 0,
    "includeInFt" BOOLEAN NOT NULL DEFAULT true,
    "remarks" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightPlan" (
    "id" SERIAL NOT NULL,
    "depAd" TEXT NOT NULL,
    "arrAd" TEXT NOT NULL,
    "route" TEXT,
    "alternate" TEXT,
    "cruiseLevel" TEXT,
    "cruiseSpeed" TEXT,
    "fuelPlan" DOUBLE PRECISION,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "remarks" TEXT,
    "weather" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logbookEntryId" INTEGER,

    CONSTRAINT "FlightPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightRecording" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "logbookEntryId" INTEGER NOT NULL,

    CONSTRAINT "FlightRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'SCHOOL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EntryCrew" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_EntryCrew_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "LogbookEntry_unique_key" ON "LogbookEntry"("unique");

-- CreateIndex
CREATE UNIQUE INDEX "FlightPlan_logbookEntryId_key" ON "FlightPlan"("logbookEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "FlightRecording_logbookEntryId_key" ON "FlightRecording"("logbookEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_handle_key" ON "Organization"("handle");

-- CreateIndex
CREATE INDEX "_EntryCrew_B_index" ON "_EntryCrew"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightPlan" ADD CONSTRAINT "FlightPlan_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "LogbookEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightRecording" ADD CONSTRAINT "FlightRecording_logbookEntryId_fkey" FOREIGN KEY ("logbookEntryId") REFERENCES "LogbookEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryCrew" ADD CONSTRAINT "_EntryCrew_A_fkey" FOREIGN KEY ("A") REFERENCES "LogbookEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EntryCrew" ADD CONSTRAINT "_EntryCrew_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
