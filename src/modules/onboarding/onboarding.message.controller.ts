import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OnboardingService } from './onboarding.service';
import {
  RegisterDto,
  LoginDto,
  LoginPinDto,
  ConfirmResetDto,
  StartResetDto,
} from './dto/dtos';

@Controller()
export class OnboardingMessageController {
  constructor(private readonly svc: OnboardingService) {}

  @MessagePattern({ cmd: 'onboarding.email.start' })
  startEmailVerification(@Payload() payload: { email: string }) {
    return this.svc.startEmailVerification(payload.email);
  }

  @MessagePattern({ cmd: 'onboarding.email.confirm' })
  confirmEmailVerification(@Payload() payload: { email: string; code: string }) {
    return this.svc.confirmEmailVerification(payload.email, payload.code);
  }

  @MessagePattern({ cmd: 'onboarding.register' })
  register(@Payload() dto: RegisterDto) {
    return this.svc.register(dto);
  }

  @MessagePattern({ cmd: 'onboarding.login.password' })
  loginPassword(@Payload() dto: LoginDto) {
    return this.svc.loginPassword(dto);
  }

  @MessagePattern({ cmd: 'onboarding.pin.set' })
  setPin(@Payload() payload: { userId: string; pin: string }) {
    return this.svc.setPin(payload.userId, payload.pin);
  }

  @MessagePattern({ cmd: 'onboarding.login.pin' })
  loginPin(@Payload() dto: LoginPinDto) {
    return this.svc.loginPin(dto);
  }

  @MessagePattern({ cmd: 'onboarding.reset.start' })
  startReset(@Payload() dto: StartResetDto) {
    return this.svc.startReset(dto);
  }

  @MessagePattern({ cmd: 'onboarding.reset.confirm' })
  confirmReset(@Payload() dto: ConfirmResetDto) {
    return this.svc.confirmReset(dto);
  }
}