"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const auth_main_1 = require("./auth.main");
const express = __importStar(require("express"));
async function bootstrap() {
    const logger = new common_1.Logger('Crypt2P');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // ✅ Security + CORS
    app.use((0, helmet_1.default)());
    app.enableCors();
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString(); // capture original body
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new auth_main_1.AllRpcExceptionFilter());
    // ✅ Swagger API Docs
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Crypt2P Trading Engine')
        .setDescription('Crypto <-> NGN real-time trading & wallet automation')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    /* --------------------------------------------------------
      ✅ Build RabbitMQ Connection String (Encoded)
    ---------------------------------------------------------*/
    const rmqHost = process.env.RABBITMQ_HOST;
    const rmqPort = process.env.RABBITMQ_PORT || '5672';
    const rmqUser = process.env.RABBITMQ_USER;
    const rmqPass = encodeURIComponent(process.env.RABBITMQ_PASS || '');
    const rmqVhost = encodeURIComponent(process.env.RABBITMQ_VHOST || '/');
    const rmqQueue = process.env.VALIDATION_QUEUE;
    let rmqUrl = null;
    if (rmqHost && rmqUser && rmqPass) {
        rmqUrl = `amqp://${rmqUser}:${rmqPass}@${rmqHost}:${rmqPort}/${rmqVhost}`;
    }
    console.log('🚨 RabbitMQ HOST:', rmqHost);
    console.log('🔐 Encoded RabbitMQ URL:', rmqUrl);
    /* --------------------------------------------------------
      ✅ RMQ Microservice Bootstrap
    ---------------------------------------------------------*/
    if (rmqUrl) {
        logger.log(`🔄 Connecting to RabbitMQ... → ${rmqUrl}`);
        app.connectMicroservice({
            transport: microservices_1.Transport.RMQ,
            options: {
                urls: [rmqUrl],
                queue: rmqQueue,
                queueOptions: { durable: true },
                heartbeat: 60,
                prefetchCount: 1,
            },
        });
        await app.startAllMicroservices();
        logger.log(`✅ RMQ Microservice listening → Queue: ${rmqQueue}`);
    }
    else {
        logger.warn('⚠ RMQ disabled — Host/User/Pass missing in ENV');
    }
    /* --------------------------------------------------------
      ✅ Start HTTP Server
    ---------------------------------------------------------*/
    const port = process.env.PORT || 4007;
    await app.listen(port);
    logger.log(`🚀 Crypt2P Service → http://localhost:${port}`);
    logger.log(`📘 Swagger Docs → /docs`);
    logger.log('✅ App Ready');
}
bootstrap();
//# sourceMappingURL=main.js.map