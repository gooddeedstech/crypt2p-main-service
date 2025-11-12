import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { NotificationType, NotificationChannel } from '@/entities/notification.entity';

export class SendNotificationDto {
  @ApiProperty({ example: 'c1c94815-5f1d-4f0d-b8f7-7eecb85f0b0b' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Deposit Confirmed' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Your ₦50,000 deposit has been confirmed successfully.' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.SYSTEM })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.SYSTEM;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.ALL })
  @IsEnum(NotificationChannel)
  @IsOptional()
  channel?: NotificationChannel = NotificationChannel.ALL;

  @ApiPropertyOptional({ example: { transactionId: 'abc123', amount: 50000 } })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

}