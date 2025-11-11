import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BushaAPIService } from './busha-api.service';
import { BushaAPIMessageController } from './busha-api.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '@/entities/wallet.entity';
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
import { EmailService } from '../notification/email.service';
import { PaystackService } from '../paystack/paystack.service';
import { BushaBuyMessageController } from './buy-service/busha-buy.message.controller';
import { BushaBuyService } from './buy-service/busha-buy.service';

 
@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User, PasswordReset, EmailVerification,  WebhookEvent, Asset, CryptoTransaction, SystemConfig]), HttpModule],
  
  providers: [BushaAPIService, JwtService, EmailService, PaystackService, BushaBuyService , BushaWalletService, BushaDepositService,BushaBuyMessageController, SystemConfigService, RubiesBankMapperService, RubiesService, OnboardingService],
  controllers: [BushaAPIMessageController, BushaWebhookMessageController],
  exports: [BushaAPIService],
})
export class BushaAPIModule {}