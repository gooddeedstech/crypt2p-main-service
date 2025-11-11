import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BushaDepositService } from './wallet/busha-deposit.service';
import { CryptoTransactionStatus } from '@/entities/crypto-transaction.entity';


@Controller()
export class BushaWebhookMessageController {
  private readonly logger = new Logger(BushaWebhookMessageController.name);

  constructor(private readonly depositService: BushaDepositService) {}

  @MessagePattern({ cmd: 'busha.sell.webhook' })
  async handleBushaWebhook(@Payload() payload: any) {
    this.logger.log(`📩 Received verified Busha webhook → ${payload.event}`);

    try {
      const data = payload.data;
      await this.depositService.updateStatusFromBushaWebhook(data);

      this.logger.log(`✅ Deposit updated for transfer ${data.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Failed to process Busha webhook: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @MessagePattern({ cmd: 'busha.deposit.findByUser' })
async handleFindDeposits(@Payload() payload: { userId: string; status?: CryptoTransactionStatus }) {
  return this.depositService.findDepositsByUserId(payload.userId, payload.status);
}
}