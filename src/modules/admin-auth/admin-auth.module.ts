import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '@/entities/admin-user.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthMessageController } from './admin-auth.message.controller';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from '../email-service/email.service';
import { UserAnalyticsService } from '../analytics/user-analytics.service';
import { User } from '@/entities/user.entity';
import { CryptoTransaction } from '@/entities/crypto-transaction.entity';
import { AnalyticsMessageController } from '../analytics/user-analytics.message.controller';
import { TransactionAnalyticsMessageController } from '../analytics/transaction-analytics.message.controller';
import { TransactionAnalyticsService } from '../analytics/transaction-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser, User, CryptoTransaction]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_ADMIN ,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AdminAuthService,UserAnalyticsService , EmailService, TransactionAnalyticsService],
  controllers: [AdminAuthMessageController, AnalyticsMessageController, TransactionAnalyticsMessageController],
})
export class AdminAuthModule {}