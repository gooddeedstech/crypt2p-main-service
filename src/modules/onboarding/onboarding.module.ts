import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { User } from '@/entities/user.entity'
import { RefreshToken } from '@/entities/refresh-token.entity'
import { PasswordReset } from '@/entities/password-reset.entity'
import { OnboardingService } from './onboarding.service'
import { OnboardingMessageController } from './onboarding.message.controller'
import { EmailVerification } from '@/entities/email-verification.entity'
import { EmailService } from '../notification/email.service'
import { PaystackService } from '../paystack/paystack.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset, EmailVerification]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: process.env.JWT_EXPIRES || '1d' }
    })
  ],
  controllers: [OnboardingMessageController],
  providers: [OnboardingService, EmailService, PaystackService]
})
export class OnboardingModule {}
