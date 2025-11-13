import { AdminRole } from '@/entities/admin-user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';


export class CreateAdminUserDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'Admin first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Admin last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'supersecurepassword123',
    description: 'Password for the admin account',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: AdminRole,
    example: AdminRole.SUPPORT,
    description: 'Role assigned to the admin',
  })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiProperty({
    example: '+2348012345678',
    description: 'Admin phone number (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({
    example: 'admin@example.com',
    description: 'Admin email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'Jane',
    description: 'Admin first name',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Admin last name',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Admin phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: AdminRole,
    example: AdminRole.SUPPORT,
    description: 'Role assigned to the admin',
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @ApiPropertyOptional({
    example: 'newsecurepassword123',
    description: 'New password (optional)',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}