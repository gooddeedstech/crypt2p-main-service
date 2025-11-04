import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { WalletsService } from './wallets.service'

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly svc: WalletsService) {}
  @Post('addresses') create(@Body() dto: { userId: string; asset: 'BTC'|'ETH'|'USDT'; network?: string }) { return this.svc.createAddress(dto) }
}
