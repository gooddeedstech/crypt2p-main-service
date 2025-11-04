import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { BushaService } from './busha.service'

@ApiTags('Busha')
@Controller('busha')
export class BushaController {
  constructor(private readonly svc: BushaService) {}
  @Post('addresses')
  create(@Body() dto: { userId: string; asset: 'BTC'|'ETH'|'USDT'; network?: string }) {
    return this.svc.createUserAddress(dto)
  }
}
