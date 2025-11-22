import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BushaAPIService } from './busha-api.service';
import { BushaWalletService } from './wallet/busha-wallet.service';
import { AssetType } from '@/entities/assets.entity';
import { BushaTransactionService } from './transaction-confirmation/transaction-confirmation.service';


@Controller()
export class BushaAPIMessageController {
   private readonly logger = new Logger(BushaAPIMessageController.name);
  constructor(
    private readonly busha: BushaAPIService,
    private readonly bushaWalletService: BushaWalletService,
    private readonly bushaTransactionService: BushaTransactionService,
  ) {}

@MessagePattern({ cmd: 'busha.assets' })
async listPairs(@Payload() payload?: { type?: AssetType }) {
  return this.busha.listAllActiveAssets(payload?.type);
}


    @MessagePattern({ cmd: 'busha.wallet.generate' })
  async handleGenerateWallet(
    @Payload()
    payload: { userId: string, asset: string; amount: string; exchangeRate: string; network: string, bankId: string },
  ) {
    this.logger.log(`📩 Received wallet generation request: ${JSON.stringify(payload)}`);

    const { userId, asset, amount, exchangeRate,  network, bankId } = payload;
    return await this.bushaWalletService.generateDepositWallet(userId, asset, amount, network, bankId);
  }

    @MessagePattern({ cmd: 'busha.confirm.transaction' })
  async handleConfirmBushaTransaction(
    @Payload() payload: { transferId: string },
  ) {
    const { transferId } = payload;
    return this.bushaTransactionService.confirmBushaTransaction(transferId);
  }



}