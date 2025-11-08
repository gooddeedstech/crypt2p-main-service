import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Deposit } from '@/entities/deposit.entity';
import { CryptoDeposit, DepositStatus } from '@/entities/crypto-deposit.entity';


@Injectable()
export class BushaDepositService {
  private readonly logger = new Logger(BushaDepositService.name);

  constructor(
    @InjectRepository(CryptoDeposit)
    private readonly depositRepo: Repository<CryptoDeposit>,
  ) {}

async updateStatusFromBushaWebhook(payload: any) {
    const { id: transferId, status, quote_id } = payload;
    const deposit = await this.depositRepo.findOne({ where: { transfer_id: transferId } });

    if (!deposit) {
      this.logger.warn(`⚠ Deposit not found for transfer ${transferId}`);
      return;
    }

    console.log(`Meyi ${status}`)

    // Map Busha status → internal status
    let internalStatus: DepositStatus = DepositStatus.PENDING;

    if (['processing'].includes(status)) internalStatus = DepositStatus.PROCESSING;
    if (['completed', 'successful', 'funds_converted', 'funds_received'].includes(status))
      internalStatus = DepositStatus.SUCCESSFUL;
    if (['failed'].includes(status))
      internalStatus = DepositStatus.FAILED;
     if (['cancelled'].includes(status))
      internalStatus = DepositStatus.CANCELLED;

    deposit.status = internalStatus;
    if (internalStatus === DepositStatus.SUCCESSFUL) {
      deposit.confirmed_at = new Date();

    }

    await this.depositRepo.save(deposit);
    this.logger.log(`✅ Deposit ${transferId} updated → ${internalStatus}`);

      if (internalStatus === DepositStatus.SUCCESSFUL) {
      // TODO: Credit user NGN wallet here
      // await this.walletService.creditFiat(existing.userId, ngnAmount);
      }
    return deposit;
  }


  async findDepositsByUserId(
    userId: string,
    status?: DepositStatus,
  ): Promise<CryptoDeposit[]> {
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