// import { Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common'
// import { ApiExcludeController } from '@nestjs/swagger'
// import { InjectRepository } from '@nestjs/typeorm'
// import { Repository } from 'typeorm'
// import { WebhookEvent } from '../../entities/webhook-event.entity'
// import { Wallet } from '../../entities/wallet.entity'
// import { Deposit } from '../../entities/deposit.entity'
// import { hmacSha256Hex } from '../../common/crypto.util'
// import { NotifyService } from '../notify/notify.service'
// import { TradesService } from '../trades/trades.service'
// import { PayoutService } from '../payout/payout.service'
// import { User } from '../../entities/user.entity'
// import { LedgerEntry } from '../../entities/ledger.entity'
// @ApiExcludeController()
// @Controller('busha/webhook')
// export class BushaWebhookController {
//   constructor(
//     @InjectRepository(WebhookEvent) private events: Repository<WebhookEvent>,
//     @InjectRepository(Wallet) private wallets: Repository<Wallet>,
//     @InjectRepository(Deposit) private deposits: Repository<Deposit>,
//     @InjectRepository(User) private users: Repository<User>,
//     @InjectRepository(LedgerEntry) private ledger: Repository<LedgerEntry>,
//     private notify: NotifyService,
//     private trades: TradesService,
//     private payout: PayoutService,
//   ) {}
//   private verify(raw: Buffer, sig: string) {
//     const calc = hmacSha256Hex(process.env.BUSHA_WEBHOOK_SECRET!, raw)
//     if (calc !== sig) throw new Error('Invalid signature')
//   }
//   @Post()
//   @HttpCode(200)
//   async handle(@Req() req: any, @Headers('x-busha-signature') signature: string, @Body() payload: any) {
//     this.verify(req.rawBody as Buffer, signature || '')
//     const event = await this.events.save(this.events.create({
//       provider: 'busha', eventType: payload?.type || 'unknown', payload, signature, status: 'RECEIVED'
//     }))
//     if (payload?.type === 'deposit.confirmed') {
//       const d = payload.data
//       const address = d.address; const txHash = d.txHash || d.hash; const asset = d.asset; const amount = d.amount; const network = d.network
//       const wallet = await this.wallets.findOne({ where: { address }, relations: ['user'] })
//       if (!wallet) { await this.events.update({ id: event.id }, { status: 'IGNORED' }); return { ignored: true } }
//       let deposit = await this.deposits.findOne({ where: { txHash } })
//       if (!deposit) {
//         deposit = await this.deposits.save(this.deposits.create({
//           userId: wallet.user.id, asset, network, txHash, amountAsset: String(amount), status: 'CONFIRMED', bushaRef: d.id || null
//         }))
//       } else {
//         deposit.confirmations = 1; deposit.status = 'CONFIRMED'; await this.deposits.save(deposit)
//       }
//       await this.notify.publish('deposit.confirmed', { userId: deposit.userId, txHash, asset, amount })
//       await this.notify.callback('deposit.confirmed', { userId: deposit.userId, txHash, asset, amount })
//       const { estNgn, quoteId } = await this.trades.quote({ asset, amount: String(deposit.amountAsset), to: 'NGN' })
//       await this.trades.exec(quoteId)
//       await this.ledger.save([
//         this.ledger.create({ userId: deposit.userId, type: 'CREDIT_DEPOSIT', currency: asset, amount: String(deposit.amountAsset), meta: { txHash } }),
//         this.ledger.create({ userId: deposit.userId, type: 'FX', currency: 'NGN', amount: String(estNgn), meta: { quoteId } }),
//       ])
//       const user = await this.users.findOne({ where: { id: deposit.userId } })
//       const payout = await this.payout.sendToBank({ userId: user!.id, amountNgn: Number(estNgn), narration: `Crypt2P—${asset}→NGN ${txHash?.slice(0,8)}` })
//       deposit.amountNgn = String(estNgn); deposit.status = 'SETTLED'; await this.deposits.save(deposit)
//       await this.events.update({ id: event.id }, { status: 'PROCESSED' })
//       await this.notify.publish('deposit.settled', { userId: deposit.userId, depositId: deposit.id, payoutId: payout.id, amountNgn: estNgn })
//       await this.notify.callback('deposit.settled', { userId: deposit.userId, depositId: deposit.id, payoutId: payout.id, amountNgn: estNgn })
//       return { ok: true }
//     }
//     return { ok: true }
//   }
// }
//# sourceMappingURL=webhook.controller.js.map