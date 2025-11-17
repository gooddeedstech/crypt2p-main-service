import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { User } from '../../entities/user.entity'
import { SystemConfigMessageController } from '../system-settings/system-config.message.controller'
import { SystemConfigService } from '../system-settings/system-config.service'
import { SystemConfig } from '@/entities/system-config.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SystemConfig]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES }
    })
  ],
  controllers: [AuthController, SystemConfigMessageController],
  providers: [AuthService, SystemConfigService],
  exports: [AuthService]
})
export class AuthModule {}
