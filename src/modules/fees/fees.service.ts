import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { Fee } from '@/entities/fees.entity';
import { CreateFeeDto, UpdateFeeDto } from './dto/fee.dto';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    @InjectRepository(Fee)
    private readonly feeRepo: Repository<Fee>,
  ) {}

  /** 🧾 Create a new fee record */
  async create(dto: CreateFeeDto) {
    try {
      const exists = await this.feeRepo.findOne({ where: { asset: dto.asset } });
      if (exists) {
        throw new RpcException({
          statusCode: 400,
          message: `Fee for ${dto.asset} already exists`,
        });
      }

      const fee = this.feeRepo.create(dto);
      await this.feeRepo.save(fee);
      return { message: 'Fee created successfully', fee };
    } catch (error) {
      this.logger.error('❌ createFee error:', error.message);
      throw new RpcException({
        statusCode: 500,
        message: 'Failed to create fee record',
      });
    }
  }

  /** 🔍 Find fee by asset */
  async findByAsset(asset: string) {
    const fee = await this.feeRepo.findOne({ where: { asset } });
    if (!fee)
      throw new RpcException({
        statusCode: 404,
        message: `No fee record found for ${asset}`,
      });
    return fee;
  }

  /** 🔁 Update fee by asset */
  async update(dto: UpdateFeeDto) {
    const fee = await this.feeRepo.findOne({ where: { asset: dto.asset } });
    if (!fee)
      throw new RpcException({
        statusCode: 404,
        message: `Fee record not found for ${dto.asset}`,
      });

    fee.fee = dto.fee;
    await this.feeRepo.save(fee);

    return { message: `Fee updated for ${dto.asset}`, fee };
  }

  /** 📜 List all fees */
  async findAll() {
    return this.feeRepo.find({ order: { asset: 'ASC' } });
  }
}