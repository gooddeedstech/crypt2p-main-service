"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const zod_1 = require("zod");
// ✅ Onboarding Entities
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const password_reset_entity_1 = require("./entities/password-reset.entity");
// ✅ Feature Modules
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const wallets_module_1 = require("./modules/wallets/wallets.module");
const busha_module_1 = require("./modules/busha/busha.module");
const trades_module_1 = require("./modules/trades/trades.module");
const payout_module_1 = require("./modules/payout/payout.module");
const notify_module_1 = require("./modules/notify/notify.module");
const validation_module_1 = require("./modules/validation/validation.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
// ✅ Environment validation using Zod
const envSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    NODE_ENV: zod_1.z.enum(['development', 'production']).default('development'),
    JWT_SECRET: zod_1.z.string().min(10, 'JWT_SECRET is required'),
});
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // ✅ Validates .env before app boots
            config_1.ConfigModule.forRoot({
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
            // ✅ DB Connection (Prod Safe)
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => {
                    const isProd = config.get('NODE_ENV') === 'production';
                    return {
                        type: 'postgres',
                        url: config.get('DATABASE_URL'),
                        ssl: isProd ? { rejectUnauthorized: false } : false,
                        namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
                        autoLoadEntities: true,
                        synchronize: !isProd,
                        migrationsRun: isProd,
                        migrations: ['dist/migrations/*.js'],
                        logging: !isProd ? ['query', 'error'] : ['error'],
                        retryAttempts: 10,
                        retryDelay: 2000,
                    };
                },
            }),
            // ✅ Security: Rate limiting auth endpoints
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
            // ✅ Entities needed for onboarding logic
            typeorm_1.TypeOrmModule.forFeature([refresh_token_entity_1.RefreshToken, password_reset_entity_1.PasswordReset]),
            // ✅ Core Modules
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            wallets_module_1.WalletsModule,
            busha_module_1.BushaModule,
            trades_module_1.TradesModule,
            payout_module_1.PayoutModule,
            notify_module_1.NotifyModule,
            validation_module_1.ValidationModule,
            onboarding_module_1.OnboardingModule, // ✅ User onboarding now included
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map