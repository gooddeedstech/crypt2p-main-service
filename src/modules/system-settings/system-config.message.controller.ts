import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SystemConfigService } from './system-config.service';
import { ConfigStatus } from '@/entities/system-config.entity';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Controller()
export class SystemConfigMessageController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

// microservice controller
@MessagePattern({ cmd: 'system-config:get-all' })
async getAllConfigs() {
  return this.systemConfigService.getAllConfigs();
}

@MessagePattern({ cmd: 'system-config:update-all' })
async updateAllConfigs(@Payload() dto: UpdateSystemConfigDto) {
  return this.systemConfigService.updateAllConfigs(dto);
}
}