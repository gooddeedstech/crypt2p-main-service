import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { z } from 'zod';

// ✅ Core Entities
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { Deposit } from './entities/deposit.entity';
import { Payout } from './entities/payout.entity';
import { LedgerEntry } from './entities/ledger.entity';
import { WebhookEvent } from './entities/webhook-event.entity';

// ✅ Validation & Security Logs
import { ValidationLog } from './entities/validation-log.entity';
import { AuditLog } from './entities/audit-log.entity';


// ✅ Feature Modules
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { BushaModule } from './modules/busha/busha.module';
import { TradesModule } from './modules/trades/trades.module';
import { PayoutModule } from './modules/payout/payout.module';
import { NotifyModule } from './modules/notify/notify.module';
import { ValidationModule } from './modules/validation/validation.module';

// ✅ Environment validation using Zod
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

@Module({
  imports: [
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

    // ✅ DB Connection
  TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const isProd = config.get('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      url: config.getOrThrow<string>('DATABASE_URL'),

      ssl: isProd ? { rejectUnauthorized: false } : false,

      namingStrategy: new SnakeNamingStrategy(),

      autoLoadEntities: true,

      // ✅ Development → synchronize schema automatically
      // ✅ Production → migrations only
      synchronize: !isProd,
      migrationsRun: isProd,
      migrations: ['dist/migrations/*.js'],

      logging: !isProd ? ['query', 'error'] : ['error'],

      retryAttempts: 10,
      retryDelay: 2000,
    };
  },
}),

    // ✅ Feature Modules
    AuthModule,
    UsersModule,
    WalletsModule,
    BushaModule,
    TradesModule,
    PayoutModule,
    NotifyModule,
    ValidationModule, // ✅ newly added
  ],
})
export class AppModule {}