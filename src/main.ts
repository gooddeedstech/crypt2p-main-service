import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Crypt2P');

  // ✅ HTTP App Instance
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ✅ Swagger Documentation for Crypt2P
  const config = new DocumentBuilder()
    .setTitle('Crypt2P Trading Engine')
    .setDescription('Crypto <-> Naira real-time exchange service')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  /* --------------------------------------------------------
    ✅ RMQ Microservice (Optional)
    Connect ONLY if RabbitMQ URL available in ENV
  ---------------------------------------------------------*/
  const rmqUrl = process.env.RABBITMQ_URL;
  const rmqQueue = process.env.CRYPT2P_QUEUE || 'crypt2p_queue';

  console.log("🚨 RABBIT URL =", process.env.RABBITMQ_URL);

  if (rmqUrl) {
    logger.log(`🔄 RabbitMQ detected → Connecting to ${rmqUrl}`);

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
    logger.warn('⚠ RMQ disabled → Missing RABBITMQ_URL');
  }

  /* --------------------------------------------------------
    ✅ Start HTTP Server
  ---------------------------------------------------------*/
  const port = process.env.PORT || 4007;
  await app.listen(port);

  logger.log(`🚀 Crypt2P HTTP running on http://localhost:${port}`);
  logger.log(`📘 Swagger Docs → http://localhost:${port}/docs`);
  logger.log('✅ App Ready');
}

bootstrap();