import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { ExchangeRateService } from './exchange-rate.service';
import { CoinbaseService } from './coinbase.service';

@WebSocketGateway({
  cors: { origin: '*' },
  transports: ['websocket'],
})
@Injectable()
export class PriceGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PriceGateway.name);

  constructor(
    private readonly coinbase: CoinbaseService,
    private readonly rateService: ExchangeRateService,
  ) {}

  onModuleInit() {
    this.startLiveFeed();
  }

  private startLiveFeed() {
    // setInterval(async () => {
    //   try {
    //     const usdRate = await this.rateService.getUsdToNgn();
    //     const prices = await this.coinbase.getAllPrices();

    //     const enriched = prices.map((p) => ({
    //       ...p,
    //       naira: Number((p.price * usdRate).toFixed(2)),
    //     }));

    //     this.server.emit('market-prices', {
    //       source: 'coinbase',
    //       usdToNgn: usdRate,
    //       timestamp: new Date().toISOString(),
    //       assets: enriched,
    //     });

    //   } catch (err) {
    //     this.logger.error('Live price broadcast failed', err.message);
    //   }
    // }, 5000); // push every 5 seconds
  }
}