import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoTransaction, CryptoTransactionStatus, ExchangeTransactionStatus } from '@/entities/crypto-transaction.entity';
import { RubiesService } from '@/modules/rubies/rubies.service';
import { RubiesTransferDto } from '@/modules/rubies/dto/rubies-transfer.dto';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';
import { RubiesBankMapperService } from '@/modules/rubies/ rubies-bank-mapper.service';


@Injectable()
export class BushaDepositService {
  private readonly logger = new Logger(BushaDepositService.name);

  constructor(
    @InjectRepository(CryptoTransaction)
    private readonly depositRepo: Repository<CryptoTransaction>,
    private readonly rubiesService: RubiesService,
    private readonly onboardingService: OnboardingService,
    private readonly rubiesBankMapperService: RubiesBankMapperService,
  ) {}

async updateStatusFromBushaWebhook(payload: any) {
    const { id: transferId, status, quote_id } = payload;
    const deposit = await this.depositRepo.findOne({ where: { transfer_id: transferId } });

    if (!deposit) {
      this.logger.warn(` Deposit not found for transfer ${transferId}`);
      return;
    }
    const user = await this.onboardingService.findById(deposit.user_id)

    // Map Busha status → internal status
    let internalStatus: CryptoTransactionStatus = CryptoTransactionStatus.PENDING;

    if (['processing'].includes(status)) internalStatus = CryptoTransactionStatus.PROCESSING;
    if (['completed', 'successful', 'funds_converted', 'funds_received'].includes(status))
      internalStatus = CryptoTransactionStatus.SUCCESSFUL;
    if (['failed'].includes(status))
      internalStatus = CryptoTransactionStatus.FAILED;
     if (['cancelled'].includes(status))
      internalStatus = CryptoTransactionStatus.CANCELLED;

    deposit.status = internalStatus;
    if (internalStatus === CryptoTransactionStatus.SUCCESSFUL) {
      deposit.confirmed_at = new Date();

    }

  // const rubiesBankDetails =  await this.rubiesBankMapperService.getRubiesBankCode(user.bankCode)

      if (internalStatus === CryptoTransactionStatus.SUCCESSFUL) {

        //  const transferDto: RubiesTransferDto = {
        //   amount: Number(deposit.convertedAmount),
        //   bankCode: '090175',
        //   bankName: 'Rubies MFB',
        //   creditAccountName: `${user.firstName} ${user.lastName}` , 
        //   creditAccountNumber: '1000000267',
        //   debitAccountName: 'Gooddeeds Technology Enterprise LTD', 
        //   debitAccountNumber: '1000000595',         
        //   narration: `Crypto Sale Payout for ${deposit.user_id}`,
        //   reference: `REF-${Date.now()}-${deposit.id}`,
        //   sessionId: Date.now().toString(),
        // };

        // console.log(transferDto)

       const transferDto: RubiesTransferDto = {
          amount: Number(deposit.convertedAmount),
          bankCode: user.bankCode,
          bankName: user.bankName,
          creditAccountName: `${user.firstName} ${user.lastName}` , 
          creditAccountNumber: user.bankAccountNo,
          debitAccountName: 'Gooddeeds Technology Enterprise LTD', 
          debitAccountNumber: '1000001179',         
          narration: `Payout for ${deposit.user_id}`,
          reference: `REF-${Date.now()}-${deposit.id}`,
          sessionId: Date.now().toString(),
        };

  // 🚀 Trigger Rubies transfer
  const fundTransfer = await this.rubiesService.fundTransfer(transferDto);

  console.log(fundTransfer)

       if(fundTransfer.responseCode == '00'){
        deposit.exchange_status = ExchangeTransactionStatus.SUCCESSFUL,
        deposit.exchange_confirmed_at = new Date()
       }else{
        deposit.exchange_status = ExchangeTransactionStatus.FAILED,
          deposit.exchange_confirmed_at = new Date()
       }
       deposit.exchange_data = fundTransfer;

   await this.depositRepo.save(deposit);
    this.logger.log(`✅ Busha Deposit ${transferId} updated → ${internalStatus}`);
     this.logger.log(`✅ Rubies Deposit ${transferId} updated → ${fundTransfer.responseMessage}`);

      }
    return deposit;
  }


  async findDepositsByUserId(
    userId: string,
    status?: CryptoTransactionStatus,
  ): Promise<CryptoTransaction[]> {
    const query = this.depositRepo
      .createQueryBuilder('deposit')
      .where('deposit.user_id = :userId', { userId })
      .orderBy('deposit.created_at', 'DESC');

    if (status) {
      query.andWhere('deposit.status = :status', { status });
    }

    const deposits = await query.getMany();

    if (!deposits.length) {
      this.logger.warn(`⚠ No deposits found for user ${userId}`);
    }

    return deposits;
  }

  

}