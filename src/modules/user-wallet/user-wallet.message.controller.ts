import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { UserWalletService } from './user-wallet.service';

@Controller()
export class UserWalletMessageController {
  private readonly logger = new Logger(UserWalletMessageController.name);

  constructor(private readonly service: UserWalletService) {}

  @MessagePattern({ cmd: 'wallet.create' })
  async create(@Payload() data: any) {
    try {
      const { userId, asset, network, address, isDefault } = data;
      return await this.service.createWallet(userId, asset, network, address, isDefault);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'wallet.list' })
  async list(@Payload() { userId }: { userId: string }) {
    try {
      return await this.service.findAllByUser(userId);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'wallet.get' })
  async get(@Payload() { id }: {  id: string }) {
    try {
      return await this.service.findById(id);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }

  @MessagePattern({ cmd: 'wallet.delete' })
  async delete(@Payload() { id }: { id: string }) {
    try {
      return await this.service.deleteWallet(id);
    } catch (err) {
      this.logger.error(err.message);
      throw new RpcException(err);
    }
  }
}