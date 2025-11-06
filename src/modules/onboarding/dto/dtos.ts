import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Gender } from '@/entities/user.entity';

/* ---------------------------------------------
 ✅ REGISTER
----------------------------------------------*/
export class RegisterDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @Length(2, 40)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @Length(2, 40)
  lastName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/, { message: 'Invalid phone number format' })
  phoneNumber: string;

  @ApiProperty({ example: 'Nigeria' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: '1990-12-25' })
  @IsOptional()
  @IsDateString()
  dob?: string; // ✅ date string for transport

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    example: 'StrongPass@123',
    description: '8-72 characters with uppercase, lowercase, number, and special char.',
  })
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,72}$/, {
    message: 'Password too weak',
  })
  password: string;
}

/* ---------------------------------------------
 ✅ USER UPDATE (PATCH)
----------------------------------------------*/
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  lastName?: string;

  @ApiPropertyOptional({ example: '+2348123456789' })
  @IsOptional()
  @Matches(/^\+?[0-9]{8,15}$/)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Ghana' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: '1995-10-02' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}

/* ---------------------------------------------
 ✅ LOGIN
----------------------------------------------*/
export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass@123' })
  @IsString()
  password: string;
}

/* ---------------------------------------------
 ✅ PIN LOGIN
----------------------------------------------*/
export class LoginPinDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234', description: '4-6 digit PIN' })
  @Matches(/^\d{4,6}$/)
  pin: string;
}

/* ---------------------------------------------
 ✅ SET PIN
----------------------------------------------*/
export class SetPinDto {
  @ApiProperty({ example: '123456', description: '4-6 digit PIN' })
  @Matches(/^\d{4,6}$/, { message: 'PIN must be 4-6 digits' })
  pin: string;
}

/* ---------------------------------------------
 ✅ CHANGE PASSWORD
----------------------------------------------*/
export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewPass@456' })
  @IsString()
  @Length(8, 72)
  newPassword: string;
}

/* ---------------------------------------------
 ✅ PASSWORD RESET - START
----------------------------------------------*/
export class StartResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}

/* ---------------------------------------------
 ✅ PASSWORD RESET - CONFIRM
----------------------------------------------*/
export class ConfirmResetDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '843920' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'ResetPass@123' })
  @IsString()
  @Length(8, 72)
  newPassword: string;
}

/* ---------------------------------------------
 ✅ DISABLE USER ACCOUNT
----------------------------------------------*/
export class DisableDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  disable: boolean;
}

/* ---------------------------------------------
 ✅ EMAIL VERIFICATION DTOs
----------------------------------------------*/
export class VerifyEmailDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '958231' })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ResendEmailDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;
}