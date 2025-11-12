import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import {
  UserDevice,
  DeviceType,
  DeviceStatus,
} from '@/entities/user-device.entity';

@Injectable()
export class UserDeviceService {
  private readonly logger = new Logger(UserDeviceService.name);

  constructor(
    @InjectRepository(UserDevice)
    private readonly deviceRepo: Repository<UserDevice>,
  ) {}

  /* -----------------------------------------------------
   ✅ REGISTER OR UPDATE DEVICE TOKEN
  ------------------------------------------------------ */
  async registerDevice(
    userId: string,
    fcmToken: string,
    deviceType: DeviceType,
    deviceName?: string,
    osVersion?: string,
    lastIp?: string,
  ) {
    try {
      if (!userId || !fcmToken) {
        throw new RpcException({
          statusCode: 400,
          message: 'Missing required fields: userId or fcmToken',
        });
      }

      // check if token already exists
      let device = await this.deviceRepo.findOne({ where: { fcmToken } });

      if (device) {
        // Update existing record
        device.lastUsedAt = new Date();
        device.status = DeviceStatus.ACTIVE;
        device.lastIp = lastIp || device.lastIp;
        await this.deviceRepo.save(device);

        this.logger.log(`🔁 Updated existing device for ${userId}`);
        return device;
      }

      // Create a new device record
      device = this.deviceRepo.create({
        userId,
        fcmToken,
        deviceType,
        deviceName,
        osVersion,
        status: DeviceStatus.ACTIVE,
        lastIp,
        lastUsedAt: new Date(),
      });

      await this.deviceRepo.save(device);
      this.logger.log(`📱 Registered new device for ${userId}`);

      return device;
    } catch (error: any) {
      this.logger.error(`❌ registerDevice error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to register device',
      });
    }
  }

  /* -----------------------------------------------------
   ✅ GET ALL DEVICES BY USER
  ------------------------------------------------------ */
  async findDevicesByUser(userId: string) {
    try {
      const devices = await this.deviceRepo.find({
        where: { userId },
        order: { lastUsedAt: 'DESC' },
      });
      return devices;
    } catch (error: any) {
      this.logger.error(`❌ findDevicesByUser error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to fetch user devices',
      });
    }
  }

  /* -----------------------------------------------------
   ✅ REMOVE A DEVICE (e.g., Logout)
  ------------------------------------------------------ */
  async removeDeviceByToken(fcmToken: string) {
    try {
      const device = await this.deviceRepo.findOne({ where: { fcmToken } });
      if (!device) {
        throw new RpcException({
          statusCode: 404,
          message: 'Device not found',
        });
      }

      await this.deviceRepo.remove(device);
      this.logger.log(`🗑️ Removed device: ${fcmToken}`);

      return { message: 'Device removed successfully' };
    } catch (error: any) {
      this.logger.error(`❌ removeDeviceByToken error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to remove device',
      });
    }
  }

  /* -----------------------------------------------------
   ✅ DEACTIVATE DEVICE (e.g., when user logs out)
  ------------------------------------------------------ */
  async deactivateDevice(fcmToken: string) {
    try {
      const device = await this.deviceRepo.findOne({ where: { fcmToken } });
      if (!device) {
        throw new RpcException({
          statusCode: 404,
          message: 'Device not found',
        });
      }

      device.status = DeviceStatus.INACTIVE;
      device.lastUsedAt = new Date();
      await this.deviceRepo.save(device);

      this.logger.log(`🚫 Device deactivated: ${fcmToken}`);

      return { message: 'Device deactivated successfully' };
    } catch (error: any) {
      this.logger.error(`❌ deactivateDevice error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to deactivate device',
      });
    }
  }

  /* -----------------------------------------------------
   ✅ REMOVE ALL DEVICES FOR A USER (e.g., account closure)
  ------------------------------------------------------ */
  async removeAllDevicesForUser(userId: string) {
    try {
      await this.deviceRepo.delete({ userId });
      this.logger.log(`🧹 Removed all devices for user ${userId}`);
      return { message: 'All devices removed successfully' };
    } catch (error: any) {
      this.logger.error(`❌ removeAllDevicesForUser error: ${error.message}`);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to remove devices',
      });
    }
  }
}