import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType, NotificationChannel } from '@/entities/notification.entity';
import { RpcException } from '@nestjs/microservices';
import * as admin from 'firebase-admin';
import { EmailService } from '../email-service/email.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UserDeviceService } from './user-devices/user-device.service';


@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly userDeviceService: UserDeviceService,
  ) {
    // Initialize Firebase if not already
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FCM_SERVICE_ACCOUNT!)),
      });
      this.logger.log('✅ Firebase Admin initialized');
    }
  }

  /** 🔔 Send Notification (multi-channel) */
async sendNotification(dto: SendNotificationDto) {
    try {
      const { userId, title, message, type, channel, data, email } = dto;

      // ✅ Save notification in DB
      const notif = this.notificationRepo.create({
        userId,
        title,
        message,
        type: type || NotificationType.SYSTEM,
        channel: channel || NotificationChannel.ALL,
        data,
      });
      await this.notificationRepo.save(notif);

      this.logger.log(`📨 Notification stored for user ${userId}: ${title}`);

      // ✅ Send via FCM (if applicable)
        if (channel === NotificationChannel.PUSH || channel === NotificationChannel.ALL) {
      const devices = await this.userDeviceService.findDevicesByUser(userId);

      if (devices && devices.length > 0) {
        const pushPayloads = devices.map((device) => {
          if (!device.fcmToken) return null;

          return admin.messaging().send({
            token: device.fcmToken,
            notification: { title, body: message },
            data: data
              ? Object.fromEntries(
                  Object.entries(data).map(([k, v]) => [k, String(v)]),
                )
              : {},
          });
        });

        // Send all notifications concurrently
        await Promise.all(pushPayloads);

        this.logger.log(`📲 Push sent to ${devices.length} device(s) for user ${userId}`);
      } else {
        this.logger.warn(`⚠️ No registered devices found for user ${userId}`);
      }
    }

      // ✅ Send via Email (if applicable)
      if (
        (channel === NotificationChannel.EMAIL || channel === NotificationChannel.ALL) &&
        email
      ) {
        await this.emailService.sendGenericNotification(email, title, message);
        this.logger.log(`📧 Email notification sent to ${email}`);
      }

      return { message: 'Notification sent successfully', data: notif };
    } catch (error: any) {
      this.logger.error(`❌ sendNotification error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to send notification',
      });
    }
  }

  /** 🧾 List user notifications */
  async getUserNotifications(userId: string) {
    const list = await this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { count: list.length, data: list };
  }

  /** ✅ Mark notification as read */
  async markAsRead(userId: string, id: string) {
    const notif = await this.notificationRepo.findOne({ where: { id, userId } });
    if (!notif) throw new RpcException({ statusCode: 404, message: 'Notification not found' });

    notif.status = NotificationStatus.READ;
    await this.notificationRepo.save(notif);
    return { message: 'Notification marked as read' };
  }
}