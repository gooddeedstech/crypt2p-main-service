import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoinbaseService } from './coinbase.service';

@ApiTags('Market')
@Controller('market')
export class MarketController {
  constructor(private readonly coinbase: CoinbaseService) {}

  @Get('prices')
  @ApiOperation({ summary: 'Get live crypto prices for Crypt2P' })
  getPrices() {
    return this.coinbase.getAllPrices();
  }
}