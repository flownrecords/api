-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SCHOOL', 'COMPANY', 'COMMUNITY', 'CLUB', 'OTHER');

-- CreateEnum
CREATE TYPE "UserOrganizationRole" AS ENUM ('GUEST', 'STUDENT', 'PILOT', 'CFI', 'CTKI', 'SM', 'OPS', 'FI', 'TKI', 'MAIN', 'OFFICE', 'SUPERVISOR', 'ADMIN', 'OTHER');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "profilePictureUrl" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "birthday" TIMESTAMP(3),
    "homeAirport" TEXT,
    "organizationId" TEXT,
    "organizationRole" "UserOrganizationRole" NOT NULL DEFAULT 'GUEST',
    "organizationJoinedAt" TIMESTAMP(3),
    "orgMemberVerifiedAt" BOOLEAN NOT NULL DEFAULT false,
    "theme" "Theme" DEFAULT 'DARK',
    "language" TEXT DEFAULT 'en',
    "publicProfile" BOOLEAN NOT NULL DEFAULT true,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logbook" (
    "id" SERIAL NOT NULL,
    "unique" TEXT NOT NULL,
    "pilotId" INTEGER,
    "userId" INTEGER NOT NULL,
    "crewId" INTEGER[],
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
    "total" DECIMAL(65,30),
    "dayTime" DECIMAL(65,30),
    "nightTime" DECIMAL(65,30),
    "sepVfr" DECIMAL(65,30),
    "sepIfr" DECIMAL(65,30),
    "meVfr" DECIMAL(65,30),
    "meIfr" DECIMAL(65,30),
    "picTime" DECIMAL(65,30),
    "copilotTime" DECIMAL(65,30),
    "multiPilotTime" DECIMAL(65,30),
    "instructorTime" DECIMAL(65,30),
    "dualTime" DECIMAL(65,30),
    "simTime" DECIMAL(65,30),
    "simInstructorTime" DECIMAL(65,30),
    "landDay" INTEGER,
    "landNight" INTEGER,
    "includeInFt" BOOLEAN NOT NULL DEFAULT true,
    "rmks" TEXT,
    "flightTrack" JSONB[],

    CONSTRAINT "logbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
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
    "membersId" INTEGER[],
    "adminsId" INTEGER[],
    "public" BOOLEAN NOT NULL DEFAULT true,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "logbook_unique_key" ON "logbook"("unique");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_handle_key" ON "organizations"("handle");

-- AddForeignKey
ALTER TABLE "logbook" ADD CONSTRAINT "logbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
