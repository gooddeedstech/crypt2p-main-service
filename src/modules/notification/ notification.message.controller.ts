import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller()
export class NotificationMessageController {
  private readonly logger = new Logger(NotificationMessageController.name);

  constructor(private readonly notificationService: NotificationService) {}

   @MessagePattern({ cmd: 'notification.send' })
  async handleSendNotification(@Payload() dto: SendNotificationDto) {
    try {
      this.logger.log(`📩 [notification.send] → ${dto.userId} | ${dto.title}`);
      return await this.notificationService.sendNotification(dto);
    } catch (err) {
      this.logger.error(`❌ handleSendNotification error: ${err.message}`);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'notification.list' })
  async list(@Payload() { userId }: { userId: string }) {
    return await this.notificationService.getUserNotifications(userId);
  }

  @MessagePattern({ cmd: 'notification.read' })
  async read(@Payload() { userId, id }: { userId: string; id: string }) {
    return await this.notificationService.markAsRead(userId, id);
  }
}