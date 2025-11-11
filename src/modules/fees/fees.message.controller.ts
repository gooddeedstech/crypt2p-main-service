import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FeesService } from './fees.service';
import { RpcException } from '@nestjs/microservices';
import { CreateFeeDto, UpdateFeeDto } from './dto/fee.dto';

@Controller()
export class FeesMessageController {
  private readonly logger = new Logger(FeesMessageController.name);

  constructor(private readonly feesService: FeesService) {}

  @MessagePattern({ cmd: 'fees.create' })
  async create(@Payload() dto: CreateFeeDto) {
    return this.feesService.create(dto);
  }

  @MessagePattern({ cmd: 'fees.find.byAsset' })
  async findByAsset(@Payload() payload: { asset: string }) {
    return this.feesService.findByAsset(payload.asset);
  }

  @MessagePattern({ cmd: 'fees.update' })
  async update(@Payload() dto: UpdateFeeDto) {
    return this.feesService.update(dto);
  }

  @MessagePattern({ cmd: 'fees.all' })
  async findAll() {
    return this.feesService.findAll();
  }
}