import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BushaAPIService } from './busha-api.service';
import { BushaWalletService } from './wallet/busha-wallet.service';
import { AssetType } from '@/entities/assets.entity';


@Controller()
export class BushaAPIMessageController {
   private readonly logger = new Logger(BushaAPIMessageController.name);
  constructor(
    private readonly busha: BushaAPIService,
    private readonly bushaWalletService: BushaWalletService,
  ) {}

@MessagePattern({ cmd: 'busha.assets' })
async listPairs(@Payload() payload?: { type?: AssetType }) {
  return this.busha.listAllActiveAssets(payload?.type);
}


    @MessagePattern({ cmd: 'busha.wallet.generate' })
  async handleGenerateWallet(
    @Payload()
    payload: { userId: string, asset: string; amount: string; exchangeRate: string; network: string },
  ) {
    this.logger.log(`📩 Received wallet generation request: ${JSON.stringify(payload)}`);

    const { userId, asset, amount, exchangeRate,  network } = payload;
    return await this.bushaWalletService.generateDepositWallet(userId, asset, amount, network);
  }



}