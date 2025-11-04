import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletsController } from './wallets.controller'
import { WalletsService } from './wallets.service'
import { Wallet } from '../../entities/wallet.entity'
import { User } from '../../entities/user.entity'
import { BushaService } from '../busha/busha.service'
import { BushaClient } from '../busha/busha.client'

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, User])],
  controllers: [WalletsController],
  providers: [WalletsService, BushaService, BushaClient]
})
export class WalletsModule {}
