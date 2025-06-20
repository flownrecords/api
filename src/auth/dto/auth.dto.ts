import { UserOrganizationRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

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