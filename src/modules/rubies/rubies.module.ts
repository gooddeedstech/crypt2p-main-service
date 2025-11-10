import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RubiesService } from './rubies.service';
import { RubiesMessageController } from './rubies.message.controller';
import { RubiesBankMapperService } from './ rubies-bank-mapper.service';
 
  
@Module({
  imports: [
    // ✅ Provides axios-based HTTP client with timeout/retries
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [
    RubiesMessageController,  
  ],
  providers: [RubiesService, RubiesBankMapperService],
  exports: [RubiesService, RubiesBankMapperService],
})
export class RubiesModule {}