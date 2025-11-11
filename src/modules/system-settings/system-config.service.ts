import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig, ConfigStatus } from '@/entities/system-config.entity';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  /** 🔍 Get all system settings */
  async findAll(): Promise<SystemConfig[]> {
    return this.configRepo.find({
      order: { setting: 'ASC' },
    });
  }

  /** ⚙️ Update setting status */
  async updateStatus(id: string, status: ConfigStatus): Promise<SystemConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new RpcException(new NotFoundException('Setting not found'));
    }

    config.status = status;
    await this.configRepo.save(config);
    return config;
  }

  /** 🔍 Find by setting name */
  async findBySetting(setting: string): Promise<SystemConfig | null> {
    return this.configRepo.findOne({ where: { setting } });
  }
}