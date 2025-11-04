import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PayoutService } from './payout.service'
import { Payout } from '../../entities/payout.entity'
import { User } from '../../entities/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Payout, User])],
  providers: [PayoutService],
  exports: [PayoutService]
})
export class PayoutModule {}
