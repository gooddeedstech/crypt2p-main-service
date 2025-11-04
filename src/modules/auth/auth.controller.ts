import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('register')
  register(@Body() dto: { email: string; password: string; fullName?: string }) {
    return this.svc.register(dto.email, dto.password, dto.fullName)
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return this.svc.login(dto.email, dto.password)
  }
}
