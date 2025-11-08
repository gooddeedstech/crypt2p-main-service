import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllRpcExceptionFilter } from './auth.main';
import * as express from 'express';


async function bootstrap() {
  const logger = new Logger('Crypt2P');
  const app = await NestFactory.create(AppModule);

  // ✅ Security + CORS
  app.use(helmet());
  app.enableCors();
  app.use(
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString(); // capture original body
    },
  }),
);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllRpcExceptionFilter());

  // ✅ Swagger API Docs
  const config = new DocumentBuilder()
    .setTitle('Crypt2P Trading Engine')
    .setDescription('Crypto <-> NGN real-time trading & wallet automation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

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

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
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
  } else {
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