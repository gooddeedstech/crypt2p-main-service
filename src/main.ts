import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Crypt2P');

  // ✅ Create HTTP App
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();

  // ✅ Create RMQ Microservice Listener (same app instance = hybrid)
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.RMQ,
  options: {
    urls: [process.env.RABBITMQ_URL],
    queue: process.env.VALIDATION_QUEUE || 'validation_queue',
    queueOptions: { durable: true },
    heartbeat: 60, // ✅ correct field for NestJS v10
    prefetchCount: 1,
  },
});

  // ✅ Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Crypt2P Service')
    .setDescription('Crypto <-> NGN trading engine')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 4007);
console.log(`test${process.env.RABBITMQ_URL} - ${process.env.CRYPT2P_QUEUE}`)
  logger.log(`✅ Crypt2P HTTP on http://localhost:${process.env.PORT ?? 4007}`);
  logger.log(`✅ RabbitMQ Listener ON → Queue: ${process.env.CRYPT2P_QUEUE}`);
  logger.log(`📘 Swagger Docs → /docs`);
}

bootstrap();