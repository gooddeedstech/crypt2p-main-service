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
const jwt_1 = require("@nestjs/jwt");
const env_validation_1 = require("./env.validation"); // ✅ NEW
// ✅ Entities & Modules (same as before)
const user_entity_1 = require("./entities/user.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const password_reset_entity_1 = require("./entities/password-reset.entity");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const notify_module_1 = require("./modules/notify/notify.module");
const validation_module_1 = require("./modules/validation/validation.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const busha_api_module_1 = require("./modules/busha-service/busha-api.module");
const onboarding_service_1 = require("./modules/onboarding/onboarding.service");
const email_verification_entity_1 = require("./entities/email-verification.entity");
const email_service_1 = require("./modules/notification/email.service");
const paystack_service_1 = require("./modules/paystack/paystack.service");
const rubies_module_1 = require("./modules/rubies/rubies.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // ✅ Load Config before everything
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: (env) => {
                    const parsed = env_validation_1.envSchema.safeParse(env);
                    if (!parsed.success) {
                        console.error('❌ ENV VALIDATION ERRORS:', parsed.error.flatten().fieldErrors);
                        throw new Error('Invalid environment variables');
                    }
                    return parsed.data;
                },
            }),
            // ✅ Database setup
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
                    namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
                    autoLoadEntities: true,
                    synchronize: config.get('NODE_ENV') !== 'production',
                    migrationsRun: config.get('NODE_ENV') === 'production',
                    migrations: ['dist/migrations/*.js'],
                }),
            }),
            // ✅ JWT Config
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => {
                    const secret = config.get('JWT_SECRET');
                    const expiresIn = config.get('JWT_EXPIRES_IN') || '1d';
                    console.log('✅ Loaded JWT_SECRET:', secret);
                    return {
                        secret,
                        signOptions: { expiresIn, algorithm: 'HS256' },
                    };
                },
            }),
            // ✅ Rate limiting
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
            // ✅ Entities + feature modules
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, refresh_token_entity_1.RefreshToken, password_reset_entity_1.PasswordReset, email_verification_entity_1.EmailVerification]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            notify_module_1.NotifyModule,
            validation_module_1.ValidationModule,
            onboarding_module_1.OnboardingModule,
            busha_api_module_1.BushaAPIModule,
            rubies_module_1.RubiesModule,
        ],
        providers: [onboarding_service_1.OnboardingService, email_service_1.EmailService, paystack_service_1.PaystackService],
        exports: [jwt_1.JwtModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map