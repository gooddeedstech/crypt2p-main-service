import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { AdminRole } from '@/entities/admin-user.entity';

export class CreateAdminDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'admin@crypt2p.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  password: string;

  @ApiProperty({ enum: AdminRole, example: AdminRole.SUPER_ADMIN })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}