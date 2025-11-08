import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BushaAPIService } from './busha-api.service';
import { BushaWalletService } from './wallet/busha-wallet.service';


@Controller()
export class BushaAPIMessageController {
   private readonly logger = new Logger(BushaAPIMessageController.name);
  constructor(
    private readonly busha: BushaAPIService,
    private readonly bushaWalletService: BushaWalletService,
  ) {}

  @MessagePattern({ cmd: 'busha.assets' })
  listPairs() {
    return this.busha.listAllActiveAssets();
  }


    @MessagePattern({ cmd: 'busha.wallet.generate' })
  async handleGenerateWallet(
    @Payload()
    payload: { userId: string, asset: string; amount: string; network: string },
  ) {
    this.logger.log(`📩 Received wallet generation request: ${JSON.stringify(payload)}`);

    const { userId, asset, amount, network } = payload;
    return await this.bushaWalletService.generateDepositWallet(userId, asset, amount, network);
  }



}