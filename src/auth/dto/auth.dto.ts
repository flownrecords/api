// import { UserOrganizationRole } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

// Temporary enum until Prisma client is generated
enum UserOrganizationRole {
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

export class AuthDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(4)
    password: string;

    @IsOptional()
    @IsString()
    organizationId?: string;

    @IsOptional()
    @IsEnum(UserOrganizationRole)
    organizationRole?: UserOrganizationRole;
}

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
