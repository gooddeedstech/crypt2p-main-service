import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RubiesService } from './rubies.service';
import { RubiesMessageController } from './rubies.message.controller';
import { RubiesBankMapperService } from './ rubies-bank-mapper.service';
import { RubiesKYCService } from './rubie-kyc.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@/entities/audit-log.entity';
import { ValidationLog } from '@/entities/validation-log.entity';
import { User } from '@/entities/user.entity';
import { OnboardingService } from '../onboarding/onboarding.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PasswordReset } from '@/entities/password-reset.entity';
import { EmailVerification } from '@/entities/email-verification.entity';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email-service/email.service';
import { LoginLogService } from '../onboarding/login-log.service';
import { LoginLog } from '@/entities/login-log.entity';
 
  
@Module({
  imports: [
    // ✅ Provides axios-based HTTP client with timeout/retries
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
     TypeOrmModule.forFeature([
          ValidationLog,
          AuditLog, 
          User, PasswordReset, EmailVerification, LoginLog
        ]),
  ],
  controllers: [
    RubiesMessageController,  
  ],
  providers: [RubiesService, RubiesBankMapperService, RubiesKYCService, OnboardingService, AuditLogService, JwtService, EmailService, LoginLogService],
  exports: [RubiesService, RubiesBankMapperService, RubiesKYCService],
})
export class RubiesModule {}