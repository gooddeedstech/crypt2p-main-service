import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ConfigStatus } from '@/entities/system-config.entity';

export class UpdateConfigStatusDto {
  @ApiProperty({ description: 'System config ID', example: '3c5f7e2f-3a0d-4b2d-8ad2-0b51b6540a32' })
  @IsUUID()
  id: string;

  @ApiProperty({ enum: ConfigStatus, example: ConfigStatus.ENABLED })
  @IsEnum(ConfigStatus)
  status: ConfigStatus;
}