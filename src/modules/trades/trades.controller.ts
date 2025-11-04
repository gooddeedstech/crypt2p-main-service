import { Body, Controller, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { TradesService } from './trades.service'

@ApiTags('Trades')
@Controller('trades')
export class TradesController {
  constructor(private readonly svc: TradesService) {}
  @Post('quote') quote(@Body() dto: { asset: 'BTC'|'ETH'|'USDT'; amount: string; to: 'NGN'|'USDT' }) { return this.svc.quote(dto) }
  @Post(':quoteId/execute') exec(@Param('quoteId') quoteId: string) { return this.svc.exec(quoteId) }
}
