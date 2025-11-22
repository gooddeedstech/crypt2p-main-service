import { Module } from '@nestjs/common';
import { PriceCacheService } from './price-cache.service';
import { ExchangeRateService } from './exchange-rate.service';
import { MarketController } from './market.controller';
import { PriceGateway } from './price.gateway';
import { CoinbaseService } from './coinbase.service';

@Module({
  controllers: [MarketController],
  providers: [
    CoinbaseService,
    PriceCacheService,
    ExchangeRateService,
    //PriceGateway
  ],
})
export class MarketModule {}