import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { JwtModule } from '@nestjs/jwt';

import { envSchema } from './env.validation'; // ✅ NEW
import { z } from 'zod';

// ✅ Entities & Modules (same as before)
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { Deposit } from './entities/deposit.entity';
import { Payout } from './entities/payout.entity';
import { LedgerEntry } from './entities/ledger.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PayoutModule } from './modules/payout/payout.module';
import { NotifyModule } from './modules/notify/notify.module';
import { ValidationModule } from './modules/validation/validation.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { BushaAPIModule } from './modules/busha-service/busha-api.module';
import { OnboardingService } from './modules/onboarding/onboarding.service';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailService } from './modules/notification/email.service';
import { PaystackService } from './modules/paystack/paystack.service';
import { RubiesModule } from './modules/rubies/rubies.module';

@Module({
  imports: [
    // ✅ Load Config before everything
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const parsed = envSchema.safeParse(env);
        if (!parsed.success) {
          console.error('❌ ENV VALIDATION ERRORS:', parsed.error.flatten().fieldErrors);
          throw new Error('Invalid environment variables');
        }
        return parsed.data;
      },
    }),

    // ✅ Database setup
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
        namingStrategy: new SnakeNamingStrategy(),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: config.get('NODE_ENV') === 'production',
        migrations: ['dist/migrations/*.js'],
      }),
    }),

    // ✅ JWT Config
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresIn = config.get<string>('JWT_EXPIRES_IN') || '1d';

        console.log('✅ Loaded JWT_SECRET:', secret);

        return {
          secret,
          signOptions: { expiresIn, algorithm: 'HS256' },
        };
      },
    }),

    // ✅ Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),

    // ✅ Entities + feature modules
    TypeOrmModule.forFeature([User, RefreshToken, PasswordReset, EmailVerification]),
    AuthModule,
    UsersModule,
    PayoutModule,
    NotifyModule,
    ValidationModule,
    OnboardingModule,
    BushaAPIModule,
    RubiesModule,
  ],

  providers: [OnboardingService, EmailService, PaystackService],
  exports: [JwtModule],
})
export class AppModule {}