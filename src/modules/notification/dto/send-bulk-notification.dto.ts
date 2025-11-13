import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { NotificationChannel, NotificationType } from '@/entities/notification.entity';

export class SendNotificationBulkDto {
  @ApiPropertyOptional({
    description: 'Single user ID or array of user IDs',
    example: ['uuid1', 'uuid2'],
  })
  @IsOptional()
  @IsArray()
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Send to all users',
    example: true,
  })
  @IsOptional()
  sendToAll?: boolean;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  data?: Record<string, any>;
}



export class SendBulkNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Message body' })
  message: string;

  @ApiProperty({
    enum: NotificationChannel,
    default: NotificationChannel.ALL,
  })
  channel: NotificationChannel;

  @ApiProperty({
    enum: NotificationType,
    default: NotificationType.ADMIN,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Optional custom data object',
    required: false,
  })
  data?: Record<string, any>;

  @ApiProperty({
    description: 'List of userIds. Leave empty to send to ALL users',
    required: false,
    type: [String],
  })
  userIds?: string[];
}


export class NotificationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsNumberString()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsNumberString()
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ description: 'Filter by title (optional)' })
  @IsString()
  @IsOptional()
  title?: string;
}