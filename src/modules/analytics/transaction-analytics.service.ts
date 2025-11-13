import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  CryptoTransaction,
  CryptoTransactionStatus,
  CryptoTransactionType,
} from '@/entities/crypto-transaction.entity';

@Injectable()
export class TransactionAnalyticsService {
  private readonly logger = new Logger(TransactionAnalyticsService.name);

  constructor(
    @InjectRepository(CryptoTransaction)
    private readonly txRepo: Repository<CryptoTransaction>,
  ) {}

  /* -----------------------------------------------------------
   🧮 DATE RANGE HELPER
  ------------------------------------------------------------*/
  private buildDateRange(filter: string) {
    const now = new Date();
    const start = new Date();

    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;

      case 'week':
        start.setDate(now.getDate() - 7);
        break;

      case 'month':
        start.setMonth(now.getMonth());
        start.setDate(1);
        break;

      case 'year':
        start.setFullYear(now.getFullYear(), 0, 1);
        break;

      default:
        return null;
    }

    return { start, end: now };
  }

  /* -----------------------------------------------------------
   📊 TRANSACTION SUMMARY (Dashboard)
  ------------------------------------------------------------*/
  async getDashboardSummary(options: {
    date?: 'today' | 'week' | 'month' | 'year';
    type?: CryptoTransactionType;
    asset?: string;
  }) {
    const { date, type, asset } = options;

    const where: any = {};

    // Date filter
    const range = this.buildDateRange(date);
    if (range) where.created_at = Between(range.start, range.end);

    // Type filter
    if (type) where.type = type;

    // Asset filter
    if (asset) where.asset = asset;

    const total = await this.txRepo.count({ where });

    const successful = await this.txRepo.count({
      where: { ...where, status: CryptoTransactionStatus.SUCCESSFUL },
    });

    const pending = await this.txRepo.count({
      where: { ...where, status: CryptoTransactionStatus.PENDING },
    });

    const failed = await this.txRepo.count({
      where: { ...where, status: CryptoTransactionStatus.FAILED },
    });

    const cancelled = await this.txRepo.count({
      where: { ...where, status: CryptoTransactionStatus.CANCELLED },
    });

    return {
      total,
      successful,
      pending,
      failed,
      cancelled,
    };
  }

  /* -----------------------------------------------------------
   🪙 TRANSACTION SUMMARY BY ASSET
  ------------------------------------------------------------*/
async getSummaryByAsset(options: {
  date?: 'today' | 'week' | 'month' | 'year';
  type?: CryptoTransactionType;
  asset?: string;
  status?: CryptoTransactionStatus;
}) {
  const { date, type, asset, status } = options;

  const range = this.buildDateRange(date);

  const qb = this.txRepo
    .createQueryBuilder('tx')
    .select('tx.asset', 'asset')
    .addSelect('COUNT(tx.id)', 'count')
    .addSelect('SUM(tx.amount)', 'totalAmount')
    .groupBy('tx.asset')
    .orderBy('"totalAmount"', 'DESC'); // 🔥 FIX alias issue

  // Filter: type of transaction
  if (type) qb.andWhere('tx.type = :type', { type });

  // Filter: asset
  if (asset) qb.andWhere('tx.asset = :asset', { asset });

  // Filter: status
  if (status) qb.andWhere('tx.status = :status', { status });

  // Filter: date range
  if (range) qb.andWhere('tx.created_at BETWEEN :start AND :end', range);

  const raw = await qb.getRawMany();

  return raw.map((r) => ({
    asset: r.asset,
    count: Number(r.count),
    totalAmount: Number(r.totalamount || r.totalAmount || 0),
  }));
}

  /* -----------------------------------------------------------
   📜 TRANSACTION LOGS (Date range + filters)
  ------------------------------------------------------------*/


 async getTransactionLogs(filter: {
  startDate?: string;
  endDate?: string;
  type?: CryptoTransactionType;
  asset?: string;
  status?: CryptoTransactionStatus;
  page?: number;
  limit?: number;
}) {
  const {
    startDate,
    endDate,
    type,
    asset,
    status,
    page = 1,
    limit = 20,
  } = filter;

  const where: any = {};

  if (startDate && endDate) {
    where.created_at = Between(
      new Date(startDate),
      new Date(endDate),
    );
  }

  if (type) where.type = type;
  if (asset) where.asset = asset;
  if (status) where.status = status;

  const qb = this.txRepo
    .createQueryBuilder('tx')
    .leftJoin('tx.user', 'user')
    .select([
      'tx.id',
      'tx.asset',
      'tx.network',
      'tx.amount',
      'tx.exchangeRate',
      'tx.convertedAmount',
      'tx.status',
      'tx.type',
      'tx.exchange_data',
      'tx.metadata',
      'tx.created_at',
      'user.email',
    ])
    .where(where)
    .orderBy('tx.created_at', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [data, total] = await qb.getManyAndCount();

  // Format response
  const formatted = data.map((tx) => ({
    email: tx.user?.email || null,
    asset: tx.asset,
    network: tx.network,
    amount: tx.amount,
    exchangeRate: tx.exchangeRate,
    convertedAmount: tx.convertedAmount,
    status: tx.status,
    type: tx.type,
    exchange_data: tx.exchange_data,
    meta_data: tx.metadata,
    created_at: tx.created_at,
  }));

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: formatted,
  };
}
}