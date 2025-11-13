import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';


export class ChangeAdminPasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current password of the admin user',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword456!',
    description: 'New password to replace the old one (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

//
// ✅ For password reset via email/OTP
//
export class ResetAdminPasswordDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address for reset request',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '734821',
    description: 'OTP or verification code sent to the email',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'MyNewStrongPassword789!',
    description: 'New password to be set after verification',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}