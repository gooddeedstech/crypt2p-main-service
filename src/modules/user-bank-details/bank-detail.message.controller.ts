import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { BankDetailService } from './bank-detail.service';

@Controller()
export class BankDetailMessageController {
  private readonly logger = new Logger(BankDetailMessageController.name);

  constructor(private readonly service: BankDetailService) {}

  @MessagePattern({ cmd: 'bank.create' })
  async create(@Payload() data: any) {
    try {
      const { userId, bankName, bankCode, accountNumber, accountName, isPrimary } = data;
      return await this.service.createBankDetail(userId, bankName, bankCode, accountNumber, accountName, isPrimary);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'bank.list' })
  async list(@Payload() { userId }: { userId: string }) {
    try {
      return await this.service.findAllByUser(userId);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'bank.get' })
  async get(@Payload() {  id }: {  id: string }) {
    try {
      return await this.service.findById(id);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'bank.delete' })
  async delete(@Payload() {  id }: {  id: string }) {
    try {
      return await this.service.deleteBankDetail( id);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }
}