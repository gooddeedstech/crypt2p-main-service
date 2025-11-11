import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SystemConfigService } from './system-config.service';
import { ConfigStatus } from '@/entities/system-config.entity';

@Controller()
export class SystemConfigMessageController {
  constructor(private readonly service: SystemConfigService) {}

  @MessagePattern({ cmd: 'config.list' })
  findAll() {
    return this.service.findAll();
  }

  @MessagePattern({ cmd: 'config.update.status' })
  updateStatus(@Payload() payload: { id: string; status: ConfigStatus }) {
    return this.service.updateStatus(payload.id, payload.status);
  }
}