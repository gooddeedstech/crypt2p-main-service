import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BushaAPIService } from './busha-api.service';
import { BushaAPIMessageController } from './busha-api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { WebhookEvent } from '@/entities/webhook-event.entity';
import { Asset } from '@/entities/assets.entity';
import { BushaWalletService } from './wallet/busha-wallet.service';
import { BushaWebhookMessageController } from './busha-api.message.controller';
import { BushaDepositService } from './wallet/busha-deposit.service';
import { CryptoTransaction } from '@/entities/crypto-transaction.entity';
import { SystemConfig } from '@/entities/system-config.entity';
import { SystemConfigService } from '../system-settings/system-config.service';
import { RubiesBankMapperService } from '../rubies/ rubies-bank-mapper.service';
import { RubiesService } from '../rubies/rubies.service';
import { OnboardingService } from '../onboarding/onboarding.service';
import { PasswordReset } from '@/entities/password-reset.entity';
import { EmailVerification } from '@/entities/email-verification.entity';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email-service/email.service';
import { PaystackService } from '../paystack/paystack.service';
import { BushaBuyMessageController } from './buy-service/busha-buy.message.controller';
import { BushaBuyService } from './buy-service/busha-buy.service';
import { FeesService } from '../fees/fees.service';
import { FeesMessageController } from '../fees/fees.message.controller';
import { Fee } from '@/entities/fees.entity';
import { BankDetail } from '@/entities/bank-detail.entity';
import { LoginLogService } from '../onboarding/login-log.service';
import { LoginLog } from '@/entities/login-log.entity';
import { LedgerMessageController } from '../transaction-ledger/transaction-ledger.controller';
import { LedgerService } from '../transaction-ledger/transaction-ledger.service';
import { TransactionLedger } from '@/entities/transaction_ledger.entity';
import { CoinbaseService } from '../coinbase/market/coinbase.service';
import { PriceCacheService } from '../coinbase/market/price-cache.service';
import { ExchangeRateService } from '../coinbase/market/exchange-rate.service';

 
@Module({
  imports: [TypeOrmModule.forFeature([ User, Fee, TransactionLedger, PasswordReset, LoginLog,  EmailVerification,  WebhookEvent, Asset, CryptoTransaction, SystemConfig, BankDetail]), HttpModule],
  
  providers: [BushaAPIService,CoinbaseService, PriceCacheService,ExchangeRateService,  JwtService,LedgerService,  EmailService, PaystackService, FeesService, BushaBuyService , LoginLogService, BushaWalletService, BushaDepositService, SystemConfigService, RubiesBankMapperService, RubiesService, OnboardingService],
  controllers: [BushaAPIMessageController, LedgerMessageController, BushaWebhookMessageController, BushaBuyMessageController, FeesMessageController],
  exports: [BushaAPIService],
})
export class BushaAPIModule {}