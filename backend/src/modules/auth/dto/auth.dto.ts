import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
