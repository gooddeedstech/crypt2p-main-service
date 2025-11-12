import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { RubiesTransferDto } from './dto/rubies-transfer.dto';
import { RubiesBvnValidationDto } from './dto/rubie-kyc.dto';
import { OnboardingService } from '../onboarding/onboarding.service';
import { BvnStatus, KycLevel, User } from '@/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ActorType } from '@/entities/audit-log.entity';
import { EmailService } from '../email-service/email.service';

@Injectable()
export class RubiesKYCService {
  private readonly logger = new Logger(RubiesKYCService.name);
  private readonly baseUrl = `${process.env.RUBIES_BASE_URL}/baas-kyc`;
  private readonly apiKey = process.env.RUBIES_SECRET_KEY!; // put your SK- key here
 

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
     private readonly http: HttpService,
     private readonly onboardingService: OnboardingService,
      private readonly audit: AuditLogService,
      private readonly emailService: EmailService,
  ) {}

  /** ✅ Helper: Common headers */
  private get headers() {
    return {
      'Content-Type': 'application/json',
      Accept: '*/*',
      Authorization: this.apiKey, // exactly as required by docs
    };
  }

    async validateBvn(dto: RubiesBvnValidationDto) {

     
    const url = `${this.baseUrl}/bvn-validation`;
    this.logger.log(`📡 Sending BVN validation request → ${url}`);

    try {
      const response = await firstValueFrom(
        this.http.post(url, dto, { headers: this.headers }),
      );

      const data = response.data;
      this.logger.log(`✅ BVN Validation successful for ${dto.bvn}`);
      console.log(data)
      const user = await this.onboardingService.findById(dto.reference)
     

      if(data.responseCode == '00'){
        user.firstName = data.firstname,
        user.lastName = data.lastname,
    user.bvnStatus = BvnStatus.VERIFIED;
    user.kycLevel = KycLevel.BASIC;
    user.bvnLastCheckedAt = new Date();
    await this.usersRepo.save(user);
    await this.audit.write({
      actorId: user.id,
      actorType: ActorType.USER,
      action: 'BVN_VERIFY_SUCCESS',
      targetId: dto.bvn,
      responseData: { data },
    });

    await this.emailService.sendBvnVerificationResult(user.email, true)

      }else{

            user.bvnStatus = BvnStatus.FAILED;
    user.bvnFailureReason =
      data?.reason || 'Account number or BVN is incorrect';
    user.bvnLastCheckedAt = new Date();

    await this.usersRepo.save(user);

    await this.audit.write({
      actorId: user.id,
      actorType: ActorType.USER,
      action: 'BVN_VERIFY_FAILED',
      targetId: dto.bvn,
      responseData: data,
    });

     await this.emailService.sendBvnVerificationResult(user.email, false)
      }

      return {
        success: true,
        message: data?.responseMessage || 'BVN validated successfully',
        data,
      };
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'BVN validation failed';

      this.logger.error(`❌ Rubies BVN validation error: ${errMsg}`);
      throw new RpcException({
        statusCode: error.response?.status || 500,
        message: errMsg,
      });
    }
  }

} 