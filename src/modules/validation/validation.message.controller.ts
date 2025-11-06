import {
  Controller,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ValidationService } from './validation.service';
import { VerifyAccountDto } from './dtos/verify-account.dto';
import { VerifyBankDto } from './dtos/verify-bank.dto';
import { VerifyBvnDto } from './dtos/verify-bvn.dto';

@Controller()
export class ValidationMessageController {
  private readonly logger = new Logger(ValidationMessageController.name);

  constructor(private readonly service: ValidationService) {}

  @MessagePattern({ cmd: 'banks.get' })
  async getBanks(@Payload() dto: VerifyBankDto) {
    this.logger.log(`➡️ Fetching Banks for country: ${dto?.country ?? 'nigeria'}`);

    try {
      return await this.service.getBanks(dto?.country);
    } catch (err) {
      this.logger.error('[banks.get] Error', err);
      throw new InternalServerErrorException('Failed to fetch banks');
    }
  }

  @MessagePattern({ cmd: 'account.verify' })
  async verifyAccount(@Payload() dto: VerifyAccountDto) {
    this.logger.log(
      `➡️ Verifying Bank Account → ${dto.accountNumber} at ${dto.bankCode}`,
    );

    if (!dto.bankCode || !dto.accountNumber) {
      throw new BadRequestException('bankCode and accountNumber are required');
    }

    try {
      return await this.service.verifyAccount(dto.bankCode, dto.accountNumber);
    } catch (err) {
      this.logger.error('[account.verify] Error', err?.response?.data || err);
      throw new InternalServerErrorException(
        err?.message || 'Account verification failed',
      );
    }
  }

@MessagePattern({ cmd: 'bvn.verify' })
async verifyBVN(@Payload() dto: VerifyBvnDto) {
  this.logger.log(
    `➡️ Verifying BVN → ${dto.bvn}, Account: ${dto.accountNumber}, Bank: ${dto.bankCode}`,
  );

  if (!dto.bvn || !dto.accountNumber || !dto.bankCode ) {
    throw new BadRequestException(
      'bvn, accountNumber, bankCode, firstName & lastName are required'
    );
  }

  try {
    // ✅ Passing null for actor for now
    return await this.service.verifyBVNWithAccount(dto);
  } catch (err) {
    this.logger.error('[bvn.verify] Error', err);
    throw new InternalServerErrorException(
      err?.message || 'BVN verification failed'
    );
  }
}

 @MessagePattern({ cmd: 'paystack.kyc.webhook' })
  processWebhook(@Payload() payload: any) {
    return this.service.processPaystackWebhook(payload);
  }

  
}