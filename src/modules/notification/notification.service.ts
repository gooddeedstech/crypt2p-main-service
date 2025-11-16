import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType, NotificationChannel } from '@/entities/notification.entity';
import { RpcException } from '@nestjs/microservices';
import * as admin from 'firebase-admin';
import { EmailService } from '../email-service/email.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UserDeviceService } from './user-devices/user-device.service';
import { join } from 'path';
import { SendBulkNotificationDto, SendNotificationBulkDto } from './dto/send-bulk-notification.dto';
import { User } from '@/entities/user.entity';
import { initializeFirebase } from '@/utils/firebase';


@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
     @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly userDeviceService: UserDeviceService,
  ) {
    // Initialize Firebase if not already
      initializeFirebase(); 
  }
  

  /** 🔔 Send Notification (multi-channel) */
async sendNotification(dto: SendNotificationDto) {
  try {
    const { userId, title, message, type, channel, data, email } = dto;

    // ---------------------------
    // 1. Save Notification to DB
    // ---------------------------
    const notif = this.notificationRepo.create({
      userId,
      title,
      message,
      type: type ?? NotificationType.SYSTEM,
      channel: channel ?? NotificationChannel.ALL,
      data: data ?? null, // OPTIONAL
    });

    await this.notificationRepo.save(notif);
    this.logger.log(`📨 Notification saved for user ${userId}`);

    // ---------------------------
    // 2. PUSH NOTIFICATION (FCM)
    // ---------------------------
    if (channel === NotificationChannel.PUSH || channel === NotificationChannel.ALL) {
      const devices = await this.userDeviceService.findDevicesByUser(userId);

      if (devices.length === 0) {
        this.logger.warn(`⚠️ No devices registered for user ${userId}`);
      } else {
        const pushPayloads = devices
          .filter((d) => !!d.fcmToken)
          .map((device) =>
            admin.messaging().send({
              token: device.fcmToken,
              notification: {
                title,
                body: message,
              },
              // Only attach data if it exists
              data: data ? this.normalizeFCMData(data) : {},
            }),
          );

        await Promise.all(pushPayloads);
        this.logger.log(`📲 Push notification sent to ${devices.length} devices`);
      }
    }

    // ---------------------------
    // 3. EMAIL NOTIFICATION
    // ---------------------------
    if (
      email &&
      (channel === NotificationChannel.EMAIL ||
        channel === NotificationChannel.ALL)
    ) {
      await this.emailService.sendGenericNotification(email, title, message);
      this.logger.log(`📧 Email sent to ${email}`);
    }

    return { message: 'Notification sent successfully', data: notif };
  } catch (error: any) {
    this.logger.error(`❌ sendNotification error: ${error.message}`);

    throw new RpcException({
      statusCode: 500,
      message: error.message || 'Failed to send notification',
    });
  }
}

/**
 * 🔧 Firebase requires all payload values to be string.
 * This helper ensures safe conversion.
 */
private normalizeFCMData(data: Record<string, any>) {
  try {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    );
  } catch {
    return {};
  }
}

 async sendBulkNotification(dto: SendBulkNotificationDto) {
  const { title, message, channel } = dto;

  let targets = [];

 
    // 2️⃣ Otherwise notify ALL users
    const users = await this.userRepo.find({ select: ['id', 'email'] });
    targets = users.map((u) => u.id);


  // 3️⃣ Send notification to each user
  await Promise.all(
    targets.map((id) =>
      this.sendNotification({
        userId: id,
        title,
        message,
        channel,
        type: NotificationType.ADMIN,

      }),
    ),
  );

  return {
    message: `Notification broadcast sent to ${targets.length} users`,
  };
}

// Utility to convert data to string format (FCM requirement)
private stringifyData(data: Record<string, any>) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));
}


async findAdminNotifications(page: number, limit: number) {
  const skip = (page - 1) * limit;

  // Fetch ALL admin notifications (NOT paginated yet)
  const all = await this.notificationRepo.find({
    where: { type: NotificationType.ADMIN },
    order: { createdAt: 'DESC' },
  });
  console.log(JSON.stringify(all))

  // Group by (title + message)
  const groupedMap = new Map<string, any>();

  for (const n of all) {
    const key = `${n.title}__${n.message}`; // grouping key

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        id: n.id,
        title: n.title,
        message: n.message,
        totalRecipients: 1,
        channel: n.channel,
        createdAt: n.createdAt,
        data: n.data,
      });
    } else {
      const existing = groupedMap.get(key);
      existing.totalRecipients++;
    }
  }

  // Convert map → array
  const groupedList = Array.from(groupedMap.values());

  // Sort by createdAt (descending)
  groupedList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Pagination
  const paginated = groupedList.slice(skip, skip + limit);

  return {
    total: groupedList.length,
    page,
    limit,
    data: paginated,
  };
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