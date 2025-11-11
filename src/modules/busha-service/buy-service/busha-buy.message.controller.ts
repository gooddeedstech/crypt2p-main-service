import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { BushaBuyService } from './busha-buy.service';

@Controller()
export class BushaBuyMessageController {
  private readonly logger = new Logger(BushaBuyMessageController.name);

  constructor(private readonly bushaBuyService: BushaBuyService) {}

  /** 🧾 Create buy (cash-to-crypto) request */
  @MessagePattern({ cmd: 'busha.buy.create' })
  async handleCreateBuy(@Payload() payload: { userId: string; asset: string; amount: number; walletAddress: string; network: string }) {
    try {
      this.logger.log(`📩 [busha.buy.create] → ${JSON.stringify(payload)}`);
      return await this.bushaBuyService.createBuyRequest(
        payload.userId,
        payload.asset,
        payload.amount,
        payload.walletAddress,
        payload.network,
      );
    } catch (error) {
      this.logger.error(`❌ handleCreateBuy error: ${error.message}`);
      throw new RpcException(error);
    }
  }

  /** ⚡ Handle Busha webhook event for Naira funds confirmation */
  @MessagePattern({ cmd: 'busha.buy.webhook' })
  async handleBushaWebhook(@Payload() payload: any) {
    try {
      this.logger.log(`📩 [busha.buy.webhook] Received Busha webhook`);
      return await this.bushaBuyService.processBushaNairaWebhook(payload);
    } catch (error) {
      this.logger.error(`❌ handleBushaWebhook error: ${error.message}`);
      throw new RpcException(error);
    }
  }
}