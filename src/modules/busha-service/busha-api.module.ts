import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BushaAPIService } from './busha-api.service';
import { BushaAPIMessageController } from './busha-api.controller';

 
@Module({
  imports: [HttpModule],
  providers: [BushaAPIService],
  controllers: [BushaAPIMessageController],
  exports: [BushaAPIService],
})
export class BushaAPIModule {}