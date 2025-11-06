import { Injectable, HttpException, HttpStatus, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationLog } from '@/entities/validation-log.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FraudService } from '../fraud/fraud.service';
import { ActorType } from '@/entities/audit-log.entity'; 
import { VerifyBvnDto } from './dtos/verify-bvn.dto';
import { BvnStatus, KycLevel, User } from '@/entities/user.entity';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private cachedBanks: any[] | null = null;
  private cacheExpiry = 0;

  constructor(
    @InjectRepository(ValidationLog)
    private readonly logRepo: Repository<ValidationLog>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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

async verifyBVNWithAccount(dto: VerifyBvnDto) {
  const { email, bvn, accountNumber, bankCode } = dto;

  const user = await this.usersRepo.findOne({ where: { email } });
  if (!user) throw new NotFoundException('Invalid email');

  if (!user.paystackCustomerCode) {
    throw new ForbiddenException('Customer Code missing');
  }

  const payload = {
    country: 'NG',
    type: 'bank_account',
    account_number: accountNumber,
    bank_code: bankCode,
    bvn,
  };

  const url = `https://api.paystack.co/customer/${user.paystackCustomerCode}/identification`;

  await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    message: 'KYC verification in progress ✅',
    status: 'pending',
    next: 'Wait for webhook confirmation',
  };
}

async processPaystackWebhook(event: any) {
  const { event: type, data } = event;

  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  const user = await this.usersRepo.findOne({
    where: { paystackCustomerCode: customerCode },
  });
  if (!user) return;

  // ✅ Common data extraction
  const actualName = data?.account_name?.trim() ?? '';
  const expectedName = `${user.firstName} ${user.lastName}`.trim();

  const fraudCheck = this.fraud.evaluateNameMatch(expectedName, actualName);

  // =====================================================
  // ✅ SUCCESS EVENT
  // =====================================================
  if (type === 'customeridentification.success') {
    user.bvnStatus = BvnStatus.VERIFIED;
    user.kycLevel = KycLevel.BASIC;
    user.bvnLastCheckedAt = new Date();
    user.bankCode = data?.identification?.bank_code;
    user.bankAccountNo = data?.identification?.account_number;

    await this.usersRepo.save(user);

    await this.audit.write({
      actorId: user.id,
      actorType: ActorType.USER,
      action: 'BVN_VERIFY_SUCCESS',
      targetId: data?.bvn,
      responseData: { expectedName, actualName, fraudCheck },
    });

    return { success: true, status: 'bvn_verified' };
  }

  // =====================================================
  // 🔴 FAILED EVENT
  // =====================================================
  if (type === 'customeridentification.failed') {
    user.bvnStatus = BvnStatus.FAILED;
    user.bvnFailureReason = data?.reason || 'Incorrect name/BVN mismatch';
    user.bvnLastCheckedAt = new Date();

    await this.usersRepo.save(user);

    await this.audit.write({
      actorId: user.id,
      actorType: ActorType.USER,
      action: 'BVN_VERIFY_FAILED',
      targetId: data?.bvn,
      responseData: data,
    });

    return { success: true, status: 'bvn_failed' };
  }

  // =====================================================
  // ⏳ ABANDONED EVENT
  // =====================================================
  if (type === 'customeridentification.abandoned') {
    user.bvnStatus = BvnStatus.PENDING;
    user.bvnFailureReason = 'User abandoned verification';
    user.bvnLastCheckedAt = new Date();

    await this.usersRepo.save(user);

    await this.audit.write({
      actorId: user.id,
      actorType: ActorType.USER,
      action: 'BVN_VERIFY_ABANDONED',
      targetId: data?.bvn,
      responseData: data,
    });

    return { success: true, status: 'bvn_pending' };
  }

  return { success: true, status: 'ignored_event' };
}
}