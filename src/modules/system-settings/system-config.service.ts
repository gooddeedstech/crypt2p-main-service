import { SystemConfig } from '@/entities/system-config.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';


@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  // ------------------------
  // GET ALL CONFIG SETTINGS
  // ------------------------
  async getAllConfigs(): Promise<SystemConfig[]> {
    return this.configRepo.find({ order: { setting: 'ASC' } });
  }

  // ------------------------
  // UPDATE MULTIPLE SETTINGS
  // ------------------------
  async updateAllConfigs(dto: UpdateSystemConfigDto): Promise<string> {
    for (const item of dto.configs) {
      const config = await this.configRepo.findOne({ where: { id: item.id } });

      if (!config) {
        throw new NotFoundException(`Config with id ${item.id} not found`);
      }

      // Merge changes
      Object.assign(config, item);

      await this.configRepo.save(config);
    }

    return 'System configuration updated successfully';
  }

   async findBySetting(setting: string): Promise<SystemConfig> {
    const config = await this.configRepo.findOne({ where: { setting } });

    if (!config) {
      throw new NotFoundException(`Setting ${setting} not found`);
    }
    return config;
  }
}