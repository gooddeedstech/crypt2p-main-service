import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Wallet } from '../../entities/wallet.entity'
import { User } from '../../entities/user.entity'
import { Deposit } from '../../entities/deposit.entity'
import { WebhookEvent } from '../../entities/webhook-event.entity'
import { BushaService } from './busha.service'
import { BushaController } from './busha.controller'
import { BushaWebhookController } from './webhook.controller'
import { TradesModule } from '../trades/trades.module'
import { PayoutModule } from '../payout/payout.module'
import { NotifyModule } from '../notify/notify.module'
import { LedgerEntry } from '@/entities/ledger.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User, Deposit, WebhookEvent, LedgerEntry]), TradesModule, PayoutModule, NotifyModule],
  controllers: [BushaController, BushaWebhookController],
  providers: [BushaService],
  exports: [BushaService]
})
export class BushaModule {}
