import { Injectable } from '@nestjs/common'
import { BushaClient } from '../busha/busha.client'

@Injectable()
export class TradesService {
  constructor(private client: BushaClient) {}
  async quote(dto: { asset: 'BTC'|'ETH'|'USDT'; amount: string; to: 'NGN'|'USDT' }) {
    const q = await this.client.createQuote({ side: 'SELL', fromAsset: dto.asset, amount: dto.amount, to: dto.to })
    const quoteId = q?.data?.id ?? q?.id
    const estNgn = Number(q?.data?.outAmount ?? q?.outAmount)
    return { quoteId, estNgn }
  }
  exec(quoteId: string) { return this.client.executeTrade({ quoteId }) }
}
