import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoTransaction, CryptoTransactionStatus, ExchangeTransactionStatus } from '@/entities/crypto-transaction.entity';
import { RubiesService } from '@/modules/rubies/rubies.service';
import { RubiesTransferDto } from '@/modules/rubies/dto/rubies-transfer.dto';
import { OnboardingService } from '@/modules/onboarding/onboarding.service';
import { RubiesBankMapperService } from '@/modules/rubies/ rubies-bank-mapper.service';
import { BankDetail } from '@/entities/bank-detail.entity';
import { User } from '@/entities/user.entity';
import { LedgerService } from '@/modules/transaction-ledger/transaction-ledger.service';


@Injectable()
export class BushaDepositService {
  private readonly logger = new Logger(BushaDepositService.name);

  constructor(
    @InjectRepository(CryptoTransaction)
    private readonly depositRepo: Repository<CryptoTransaction>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(BankDetail)
    private readonly bankRepo: Repository<BankDetail>,
    private readonly rubiesService: RubiesService,
    private readonly onboardingService: OnboardingService,
    private readonly rubiesBankMapperService: RubiesBankMapperService,
    private readonly ledgerService: LedgerService,
  ) {}

async updateStatusFromBushaWebhook(payload: any) {
    const { id: transferId, status, quote_id } = payload;
    const deposit = await this.depositRepo.findOne({ where: { transfer_id: transferId }, relations: ['bank'] });

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


      if (internalStatus === CryptoTransactionStatus.SUCCESSFUL) {


       const transferDto: RubiesTransferDto = {
          amount: Number(deposit.convertedAmount),
          bankCode: deposit.bank.bankCode,
          bankName: deposit.bank.bankName,
          creditAccountName: `${user.firstName} ${user.lastName}` , 
          creditAccountNumber: deposit.bank.accountNumber,
          debitAccountName: 'Gooddeeds Technology Enterprise LTD', 
          debitAccountNumber: '1000001179',         
          narration: `Payout From Gooddeeds Tech LTD}`,
          reference: `REF-${Date.now()}-${deposit.id}`,
          sessionId: Date.now().toString(),
        };
       user.rewardPoint = (Number(user.rewardPoint) + 1).toString()
       await this.usersRepo.save(user);

       
  // 🚀 Trigger Rubies transfer
  const fundTransfer = await this.rubiesService.fundTransfer(transferDto);

  console.log(fundTransfer)

       if(fundTransfer.responseCode == '00'){
        // Debit Transaction Ledger Account
       const desc = `Payout for ${deposit.amount}${deposit.asset} @ ${deposit.exchangeRate}`
       const debit = {
        userId: deposit.user_id, 
        description: desc,
        amount: deposit.convertedAmount
       }
        
       await this.ledgerService.debit(debit)
     this.logger.log(`✅Transaction Ledger updated → ${internalStatus}`);

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
      this.logger.warn(` No deposits found for user ${userId}`);
    }

    return deposits;
  }

  

}