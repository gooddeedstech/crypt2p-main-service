import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { UserDeviceService } from './user-device.service';
import { DeviceType } from '@/entities/user-device.entity';

@Controller()
export class UserDeviceMessageController {
  private readonly logger = new Logger(UserDeviceMessageController.name);

  constructor(private readonly deviceService: UserDeviceService) {}

  /** ✅ Register or update user device */
  @MessagePattern({ cmd: 'device.register' })
  async handleRegisterDevice(
    @Payload()
    payload: {
      userId: string;
      fcmToken: string;
      deviceType: DeviceType;
      deviceName?: string;
      osVersion?: string;
      lastIp?: string;
    },
  ) {
    try {
      this.logger.log(`📩 [device.register] ${payload.userId}`);
      return await this.deviceService.registerDevice(
        payload.userId,
        payload.fcmToken,
        payload.deviceType,
        payload.deviceName,
        payload.osVersion,
        payload.lastIp,
      );
    } catch (err) {
      this.logger.error(`❌ handleRegisterDevice error: ${err.message}`);
      throw new RpcException(err);
    }
  }

  /** ✅ Find all devices by user */
  @MessagePattern({ cmd: 'device.find.by.user' })
  async handleFindDevices(@Payload() payload: { userId: string }) {
    return await this.deviceService.findDevicesByUser(payload.userId);
  }

  /** ✅ Remove device by token */
  @MessagePattern({ cmd: 'device.remove' })
  async handleRemoveDevice(@Payload() payload: { fcmToken: string }) {
    return await this.deviceService.removeDeviceByToken(payload.fcmToken);
  }

  /** ✅ Deactivate device by token */
  @MessagePattern({ cmd: 'device.deactivate' })
  async handleDeactivateDevice(@Payload() payload: { fcmToken: string }) {
    return await this.deviceService.deactivateDevice(payload.fcmToken);
  }

  /** ✅ Remove all devices for user */
  @MessagePattern({ cmd: 'device.remove.all' })
  async handleRemoveAll(@Payload() payload: { userId: string }) {
    return await this.deviceService.removeAllDevicesForUser(payload.userId);
  }
}