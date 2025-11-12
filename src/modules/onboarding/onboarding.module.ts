import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { User } from '@/entities/user.entity'
import { RefreshToken } from '@/entities/refresh-token.entity'
import { PasswordReset } from '@/entities/password-reset.entity'
import { OnboardingService } from './onboarding.service'
import { OnboardingMessageController } from './onboarding.message.controller'
import { EmailVerification } from '@/entities/email-verification.entity'
import { EmailService } from '../email-service/email.service'
import { PaystackService } from '../paystack/paystack.service'
import { LoginLogService } from './login-log.service'
import { LoginLog } from '@/entities/login-log.entity'
import { BankDetail } from '@/entities/bank-detail.entity'
import { BankDetailService } from '../user-bank-details/bank-detail.service'
import { BankDetailMessageController } from '../user-bank-details/bank-detail.message.controller'
import { UserWalletMessageController } from '../user-wallet/user-wallet.message.controller'
import { UserWalletService } from '../user-wallet/user-wallet.service'
import { UserWallet } from '@/entities/user-wallet.entity'
import { UserDeviceMessageController } from '../notification/user-devices/user-device.message.controller'
import { UserDeviceService } from '../notification/user-devices/user-device.service'
import { UserDevice } from '@/entities/user-device.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset, EmailVerification, LoginLog, BankDetail, UserWallet, UserDevice]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: process.env.JWT_EXPIRES || '1d' }
    })
  ],
  controllers: [OnboardingMessageController, BankDetailMessageController, UserWalletMessageController, UserDeviceMessageController],
  providers: [OnboardingService, EmailService, PaystackService, LoginLogService, BankDetailService, UserWalletService, UserDeviceService]
})
export class OnboardingModule {}
