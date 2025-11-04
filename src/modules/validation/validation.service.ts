import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationLog } from '@/entities/validation-log.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FraudService } from '../fraud/fraud.service';
import { ActorType } from '@/entities/audit-log.entity'; 
import { VerifyBvnDto } from './dtos/verify-bvn.dto';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private cachedBanks: any[] | null = null;
  private cacheExpiry = 0;

  constructor(
    @InjectRepository(ValidationLog)
    private readonly logRepo: Repository<ValidationLog>,
    private readonly audit: AuditLogService,
    private readonly fraud: FraudService,
  ) {}

  private async writeValidationLog(type: string, dto: any, result: any) {
    await this.logRepo.save({
      validationType: type,
      requestData: dto,
      response: result,
    });
  }

  async getBanks(country = 'nigeria') {
    if (this.cachedBanks && this.cacheExpiry > Date.now()) {
      return this.cachedBanks;
    }

    try {
      const res = await axios.get(`https://api.paystack.co/bank?country=${country}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });

      const banks = res.data.data;
      this.cachedBanks = banks;
      this.cacheExpiry = Date.now() + 1000 * 60 * 60;

      // async log
      // ✅ inside getBanks()
      this.audit.write({
        actorId: 'system',
        actorType: ActorType.SYSTEM,
        action: 'BANKS_GET',
        responseData: banks,
      });

      return banks;
    } catch (err: any) {
      this.logger.error('Error fetching banks', err.response?.data);
      throw new HttpException('Failed to retrieve bank list', HttpStatus.BAD_GATEWAY);
    }
  }

  async verifyAccount(bankCode: string, accountNumber: string, actor?: any) {
    try {

      console.log(`${process.env.PAYSTACK_SECRET_KEY}`)
      const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const result = res.data;

      // ✅ Write audit for compliance history 
          this.audit.write({
      actorId: actor?.id ?? 'system',
      actorType: actor?.type ?? ActorType.SYSTEM,
      action: 'ACCOUNT_VERIFY',
      targetId: accountNumber,
      requestPayload: { bankCode },
      responseData: result,
    });

          // ✅ Also persist validation log for analytics
          this.writeValidationLog('ACCOUNT_VERIFY', { bankCode, accountNumber }, result);

      return result;

    } catch (err: any) {
      const errMsg = err.response?.data?.message ?? 'Account verification failed';
      throw new HttpException(errMsg, err.response?.status ?? HttpStatus.BAD_GATEWAY);
    }
  }
async verifyBVNWithAccount(
  dto: VerifyBvnDto,
  actor?: any, // Optional Actor
) {
  const { bvn, accountNumber, bankCode, firstName, lastName } = dto;

  const expectedName = `${firstName} ${lastName}`.trim();

  try {
    const payload = {
      country: 'NG',
      type: 'bank_account',
      account_number: accountNumber,
      bvn,
      bank_code: bankCode,
      first_name: firstName,
      last_name: lastName,
    };
    console.log(JSON.stringify(actor))

    const url = actor?.customerCode
      ? `https://api.paystack.co/customer/${actor.customerCode}/identification`
      : `https://api.paystack.co/bank/resolve_bvn/${bvn}`; // ✅ fallback for development

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = res?.data?.data;
    const actualName = result?.account_name?.trim();

    // ✅ Local fraud check
    const nameMatch = this.fraud.evaluateNameMatch(expectedName, actualName);

    const response = {
      status: true,
      message: 'BVN Verified Successfully ✅',
      verified: true,
      provider: 'paystack',
      bvn,
      accountNumber,
      bankCode,
      expectedName,
      actualName,
      matchPercent: nameMatch.matchPercent,
      fraud: nameMatch,
      requiresCustomerCode: !actor?.customerCode, // ✅ show missing upgrade requirement
      timestamp: new Date(),
    };

    await this.audit.write({
      actorId: actor?.id ?? 'system',
      actorType: actor?.type ?? ActorType.SYSTEM,
      action: 'BVN_VERIFY',
      targetId: bvn,
      requestPayload: dto,
      responseData: response,
    });

    await this.writeValidationLog('BVN_VERIFY', dto, response);

    return response;

  } catch (err: any) {
    this.logger.error('[BVN_VERIFY ERROR]', err?.response?.data || err);
    throw new HttpException(
      err.response?.data?.message || 'BVN verification failed',
      err.response?.status ?? HttpStatus.BAD_GATEWAY,
    );
  }
}
}