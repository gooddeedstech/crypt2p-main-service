import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { LedgerEntryType, TransactionLedger } from '@/entities/transaction_ledger.entity';
import { CreateLedgerEntryDto } from './dto/create-ledger.dto';
import { LedgerQueryDto } from './dto/query-ledger.dto';


@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    @InjectRepository(TransactionLedger)
    private readonly ledgerRepo: Repository<TransactionLedger>,
  ) {}

  /* ------------------------------------------------------------
     📌 Get User Balance
  ------------------------------------------------------------- */
 async getLastBalance(): Promise<number> {
    const [last] = await this.ledgerRepo.find({
      order: { created_at: 'DESC' },
      take: 1,
    });

    return last?.balance ?? 0;
  }

  /* -----------------------------------------------------
      CREDIT LEDGER
  ----------------------------------------------------- */
async credit(dto: { adminId: string; description: string; amount: number }) {
  const balance = Number(await this.getLastBalance()); // current balance (could be negative)
  const amount = Number(dto.amount);

  // NEW LOGIC: offset negative balance
  let newBalance: number;

  if (balance < 0) {
    const offset = balance + amount; // balance is negative, amount is positive

    newBalance = offset; // offset moves toward zero or above
  } else {
    newBalance = balance + amount;
  }

  const entry = this.ledgerRepo.create({
    user_id: dto.adminId,
    description: dto.description,
    type: LedgerEntryType.CREDIT,
    amount: amount,
    balance: newBalance,
  });

  await this.ledgerRepo.save(entry);

  return {
    message: 'Ledger credited successfully',
    data: entry,
  };
}

  /* -----------------------------------------------------
      DEBIT LEDGER
  ----------------------------------------------------- */
  async debit(dto: { userId: string; description: string; amount: number }) {
    const balance = await this.getLastBalance();

    // if (balance < dto.amount) {
    //      throw new RpcException({
    //     statusCode: 401,
    //     message: 'Insufficient balance',
    //   });

    // }

    const newBalance = Number(balance) - Number(dto.amount); // <-- FIXED

    const entry = this.ledgerRepo.create({
      user_id: dto.userId,
      description: dto.description,
      type: LedgerEntryType.DEBIT,
      amount: dto.amount,
      balance: newBalance,
    });

    await this.ledgerRepo.save(entry);

    return {
      message: 'Ledger debited successfully',
      data: entry,
    };
  }


  /* ------------------------------------------------------------
     📄 List Ledger Records (Filter + Pagination)
  ------------------------------------------------------------- */
  async listLedger(query: LedgerQueryDto) {
    const { page, limit, userId, type, startDate, endDate } = query;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.ledgerRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      total,
      page,
      limit,
      data,
    };
  }
}