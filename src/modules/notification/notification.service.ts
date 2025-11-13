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
   if (!admin.apps.length) {
      const serviceAccountPath = join(__dirname, '../../../firebase-service-account.json');
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.logger.log('✅ Firebase Admin initialized successfully');
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

 async sendBulkNotification(dto: SendBulkNotificationDto) {
  const { title, message, userIds, type, channel, data } = dto;

  let targets = [];

  // 1️⃣ If userIds provided → notify selected users
  if (userIds && userIds.length > 0) {
    targets = userIds;
  } else {
    // 2️⃣ Otherwise notify ALL users
    const users = await this.userRepo.find({ select: ['id', 'email'] });
    targets = users.map((u) => u.id);
  }

  // 3️⃣ Send notification to each user
  await Promise.all(
    targets.map((id) =>
      this.sendNotification({
        userId: id,
        title,
        message,
        channel,
        type,
        data,
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