// Temporary type definitions for Prisma models
// This is a workaround while the Prisma client is not properly generated

export enum UserOrganizationRole {
  GUEST = 'GUEST',
  STUDENT = 'STUDENT',
  PILOT = 'PILOT',
  OPS = 'OPS',
  FI = 'FI',
  TKI = 'TKI',
  MAIN = 'MAIN',
  OFFICE = 'OFFICE',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN',
  OTHER = 'OTHER'
}

export enum UserPermission {
  USER = 'USER',
  SUPPORT = 'SUPPORT',
  QUESTIONS_MANAGER = 'QUESTIONS_MANAGER',
  FPL_MANAGER = 'FPL_MANAGER',
  LOGBOOK_MANAGER = 'LOGBOOK_MANAGER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  birthday?: Date;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  bio?: string;
  location?: string;
  homeAirport?: string;
  permissions: UserPermission[];
  organizationId?: string;
  organizationRole: UserOrganizationRole;
  organizationJoinedAt?: Date;
  language: string;
  publicProfile: boolean;
  disabled: boolean;
}

export interface LogbookEntry {
  id: number;
  unique: string;
  createdAt: Date;
  updatedAt: Date;
  date?: Date;
  depAd?: string;
  arrAd?: string;
  offBlock?: Date;
  onBlock?: Date;
  aircraftType?: string;
  aircraftRegistration?: string;
  picName?: string;
  total: number;
  dayTime: number;
  nightTime: number;
  sepVfr: number;
  sepIfr: number;
  meVfr: number;
  meIfr: number;
  picTime: number;
  copilotTime: number;
  multiPilotTime: number;
  instructorTime: number;
  dualTime: number;
  simTime: number;
  simInstructorTime: number;
  landDay: number;
  landNight: number;
  includeInFt: boolean;
  remarks?: string;
  userId: number;
}