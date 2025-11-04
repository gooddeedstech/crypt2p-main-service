import { Injectable } from '@nestjs/common'
import { BushaService } from '../busha/busha.service'

@Injectable()
export class WalletsService {
  constructor(private busha: BushaService) {}
  createAddress(dto: { userId: string; asset: 'BTC'|'ETH'|'USDT'; network?: string }) {
    return this.busha.createUserAddress(dto)
  }
}
