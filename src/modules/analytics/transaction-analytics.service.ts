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
 private buildDateRange(filter?: 'today' | 'week' | 'month' | 'year') {
  const now = new Date();

  if (!filter) return null;

  let start: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (filter) {
    case 'today':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);

      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 1);

      prevEnd = new Date(prevStart);
      prevEnd.setHours(23, 59, 59, 999);
      break;

    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);

      prevStart = new Date(start);
      prevStart.setDate(prevStart.getDate() - 7);

      prevEnd = new Date(start);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
      break;

    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      break;

    case 'year':
      start = new Date(now.getFullYear(), 0, 1);

      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
      break;
  }

  return {
    start,
    end: now,
    prevStart,
    prevEnd,
  };
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
  const range = this.buildDateRange(date);

  const where: any = {};
  const wherePrev: any = {};

  // --- CURRENT RANGE ---
  if (range) where.created_at = Between(range.start, range.end);

  if (type) {
    where.type = type;
    wherePrev.type = type;
  }

  if (asset) {
    where.asset = asset;
    wherePrev.asset = asset;
  }

  // --- PREVIOUS RANGE ---
  if (range) {
    wherePrev.created_at = Between(range.prevStart, range.prevEnd);
  }

  // -----------------------------
  // CURRENT PERIOD COUNTS
  // -----------------------------
  const total = await this.txRepo.count({ where });
  const successful = await this.txRepo.count({ where: { ...where, status: 'SUCCESSFUL' } });
  const pending = await this.txRepo.count({ where: { ...where, status: 'PENDING' } });
  const failed = await this.txRepo.count({ where: { ...where, status: 'FAILED' } });
  const cancelled = await this.txRepo.count({ where: { ...where, status: 'CANCELLED' } });

  // -----------------------------
  // PREVIOUS PERIOD COUNTS
  // -----------------------------
  const prevTotal = await this.txRepo.count({ where: wherePrev });
  const prevSuccessful = await this.txRepo.count({ where: { ...wherePrev, status: 'SUCCESSFUL' } });
  const prevPending = await this.txRepo.count({ where: { ...wherePrev, status: 'PENDING' } });
  const prevFailed = await this.txRepo.count({ where: { ...wherePrev, status: 'FAILED' } });
  const prevCancelled = await this.txRepo.count({ where: { ...wherePrev, status: 'CANCELLED' } });

  // -----------------------------
  // RETURN RESULT WITH PERCENTAGE CHANGE
  // -----------------------------
  return {
    total,
    successful,
    pending,
    failed,
    cancelled,

    changes: {
      total: this.calculateChange(total, prevTotal),
      successful: this.calculateChange(successful, prevSuccessful),
      pending: this.calculateChange(pending, prevPending),
      failed: this.calculateChange(failed, prevFailed),
      cancelled: this.calculateChange(cancelled, prevCancelled),
    },
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

private calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return {
      value: current > 0 ? 100 : 0,
      direction: current > 0 ? 'up' : 'neutral',
    };
  }

  const diff = current - previous;
  const percent = (diff / previous) * 100;

  return {
    value: Math.abs(Number(percent.toFixed(2))),
    direction:
      diff > 0 ? 'up' :
      diff < 0 ? 'down' :
      'neutral',
  };
}
}