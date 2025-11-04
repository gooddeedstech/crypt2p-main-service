import { Module } from '@nestjs/common'
import { TradesService } from './trades.service'
import { TradesController } from './trades.controller'
import { BushaClient } from '../busha/busha.client'

@Module({
  providers: [TradesService, BushaClient],
  controllers: [TradesController],
  exports: [TradesService]
})
export class TradesModule {}
