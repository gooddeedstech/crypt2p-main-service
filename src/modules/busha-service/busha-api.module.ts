import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BushaAPIService } from './busha-api.service';
import { BushaAPIMessageController } from './busha-api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '@/entities/wallet.entity';
import { User } from '@/entities/user.entity';
import { Deposit } from '@/entities/deposit.entity';
import { WebhookEvent } from '@/entities/webhook-event.entity';
import { LedgerEntry } from '@/entities/ledger.entity';
import { Asset } from '@/entities/assets.entity';
import { BushaWalletService } from './wallet/busha-wallet.service';
import { CryptoDeposit } from '@/entities/crypto-deposit.entity';
import { BushaWebhookMessageController } from './busha-api.message.controller';
import { BushaDepositService } from './wallet/busha-deposit.service';

 
@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User, Deposit, WebhookEvent, LedgerEntry, Asset, CryptoDeposit]), HttpModule],
  
  providers: [BushaAPIService, BushaWalletService, BushaDepositService],
  controllers: [BushaAPIMessageController, BushaWebhookMessageController],
  exports: [BushaAPIService],
})
export class BushaAPIModule {}