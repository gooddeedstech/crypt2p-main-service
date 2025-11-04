"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const microservices_1 = require("@nestjs/microservices");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const logger = new common_1.Logger('Crypt2P');
    // ✅ Create HTTP App
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true }));
    app.enableCors();
    // ✅ Create RMQ Microservice Listener (same app instance = hybrid)
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL],
            queue: process.env.VALIDATION_QUEUE || 'validation_queue',
            queueOptions: { durable: true },
            heartbeat: 60, // ✅ correct field for NestJS v10
            prefetchCount: 1,
        },
    });
    // ✅ Swagger docs
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Crypt2P Service')
        .setDescription('Crypto <-> NGN trading engine')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 4007);
    console.log(`test${process.env.RABBITMQ_URL} - ${process.env.CRYPT2P_QUEUE}`);
    logger.log(`✅ Crypt2P HTTP on http://localhost:${process.env.PORT ?? 4007}`);
    logger.log(`✅ RabbitMQ Listener ON → Queue: ${process.env.CRYPT2P_QUEUE}`);
    logger.log(`📘 Swagger Docs → /docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map