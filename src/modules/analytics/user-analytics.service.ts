import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '@/entities/user.entity';
import { CryptoTransaction, CryptoTransactionType } from '@/entities/crypto-transaction.entity';

@Injectable()
export class UserAnalyticsService {
  private readonly logger = new Logger(UserAnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CryptoTransaction)
    private readonly txRepo: Repository<CryptoTransaction>,
  ) {}

  /* ✅ USER ANALYTICS SUMMARY */
 async getUserSummary() {
  const now = new Date();

  // 📌 Today
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // 📌 Yesterday
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const endOfYesterday = new Date(startOfYesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  // 📌 This Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = now;

  // 📌 Last Month
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // 📌 This Year
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // 📌 Last Year
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

  // -----------------------------------------------
  // 🚀 COUNTS
  // -----------------------------------------------
  const totalUsers = await this.userRepo.count();
  const activeUsers = await this.userRepo.count({ where: { isDisabled: false } });
  const deletedAccounts = await this.userRepo.count({ where: { isDeleted: true } });

  const registeredToday = await this.userRepo.count({
    where: { createdAt: Between(startOfToday, endOfToday) },
  });

  const registeredYesterday = await this.userRepo.count({
    where: { createdAt: Between(startOfYesterday, endOfYesterday) },
  });

  const registeredThisMonth = await this.userRepo.count({
    where: { createdAt: Between(startOfMonth, endOfMonth) },
  });

  const registeredLastMonth = await this.userRepo.count({
    where: { createdAt: Between(startOfLastMonth, endOfLastMonth) },
  });

  const registeredThisYear = await this.userRepo.count({
    where: { createdAt: Between(startOfYear, now) },
  });

  const registeredLastYear = await this.userRepo.count({
    where: { createdAt: Between(startOfLastYear, endOfLastYear) },
  });

  // -----------------------------------------------
  // 📊 RETURN WITH PERCENTAGE CHANGE
  // -----------------------------------------------
  return {
    totalUsers,
    registeredToday,
    registeredThisMonth,
    registeredThisYear,
    activeUsers,
    deletedAccounts,

    changes: {
      registeredToday: this.calculateChange(registeredToday, registeredYesterday),
      registeredThisMonth: this.calculateChange(registeredThisMonth, registeredLastMonth),
      registeredThisYear: this.calculateChange(registeredThisYear, registeredLastYear),
      totalUsers: this.calculateChange(totalUsers, totalUsers - registeredToday), // simplistic
      activeUsers: this.calculateChange(activeUsers, activeUsers), // or track separately
    },
  };
}

  /* 📈 USER REGISTRATION TREND (Last N Days) */
  async getDailyRegistrationStats(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.userRepo
      .createQueryBuilder('user')
      .select("TO_CHAR(DATE_TRUNC('day', user.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.created_at >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('1', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  /* 🔥 TOP ACTIVE USERS (By Transaction Count) */
  async getTopActiveUsers(type?: CryptoTransactionType) {
    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select('tx.user_id', 'userId')
      .addSelect('COUNT(tx.id)', 'transactionCount')
      .groupBy('tx.user_id')
      .orderBy('2', 'DESC')
      .limit(10);

    if (type) qb.andWhere('tx.type = :type', { type });

    const result = await qb.getRawMany();
     const userIds = result.map((r) => r.userId);
  const users = await this.userRepo.findBy({ id: In(userIds) });

    return result.map((r: any) => {
  const user = users.find((u) => u.id === r.userid || u.id === r.userId);

  return {
    user: user ? user.email : null,
    transactionCount: Number(r.transactionCount ?? 0),
  };
});
  }

  /* 💰 TOP USERS BY TRANSACTION VALUE */
 async getTopUsersByTransactionVolume(type?: CryptoTransactionType) {
  const qb = this.txRepo
    .createQueryBuilder('tx')
    .select('tx.user_id', 'userId')
    .addSelect('SUM(tx.amount)', 'totalAmount')
    .groupBy('tx.user_id')
    .orderBy('2', 'DESC')
    .limit(10);

  if (type) qb.andWhere('tx.type = :type', { type });

  const result = await qb.getRawMany();

  const userIds = result.map((r) => r.userId ?? r.userid);
  const users = await this.userRepo.findBy({ id: In(userIds) });

  return result.map((r: any) => {
    const id = r.userId ?? r.userid;
    const user = users.find((u) => u.id === id);

    return {
      user: user ? user.email : null,
      totalAmount: Number(r.totalAmount ?? 0),
    };
  });
}

  /* 🪙 TRANSACTION SUMMARY BY ASSET (Grouped by Days) */
  async getTransactionSummaryByAssetByDays(days: number, type?: CryptoTransactionType) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select("TO_CHAR(DATE_TRUNC('day', tx.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('tx.asset', 'asset')
      .addSelect('COUNT(tx.id)', 'transactionCount')
      .addSelect('SUM(tx.amount)', 'totalAmount')
      .where('tx.created_at >= :startDate', { startDate })
      .groupBy('1')
      .addGroupBy('2')
      .orderBy('1', 'ASC')
      .addOrderBy('4', 'DESC');

    if (type) qb.andWhere('tx.type = :type', { type });

    const result = await qb.getRawMany();

    const grouped = result.reduce((acc, r: any) => {
      const { date, asset, transactionCount, totalAmount } = r;
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        asset,
        transactionCount: Number(transactionCount ?? 0),
        totalAmount: Number(totalAmount ?? 0),
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([date, assets]) => ({
      date,
      assets,
    }));
  }

  /* 📊 TRANSACTION TREND (For Bar/Line Chart) */
  async getDailyTransactionTrend(days: number, type?: CryptoTransactionType) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select("TO_CHAR(DATE_TRUNC('day', tx.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(tx.id)', 'count')
      .addSelect('SUM(tx.amount)', 'totalAmount')
      .where('tx.created_at >= :startDate', { startDate })
      .groupBy('1')
      .orderBy('1', 'ASC');

    if (type) qb.andWhere('tx.type = :type', { type });

    const result = await qb.getRawMany();

    return result.map((r) => ({
      date: r.date,
      count: Number(r.count ?? 0),
      totalAmount: Number(r.totalAmount ?? 0),
    }));
  }

  /* 🧾 TRANSACTION SUMMARY BY ASSET AND DAYS */
  async getTransactionSummaryByAssetAndDays(days: number, type?: CryptoTransactionType) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const qb = this.txRepo
      .createQueryBuilder('tx')
      .select("TO_CHAR(DATE_TRUNC('day', tx.created_at), 'YYYY-MM-DD')", 'date')
      .addSelect('tx.asset', 'asset')
      .addSelect('COUNT(tx.id)', 'transactionCount')
      .addSelect('SUM(tx.amount)', 'totalAmount')
      .where('tx.created_at >= :startDate', { startDate })
      .groupBy('1')
      .addGroupBy('2')
      .orderBy('1', 'ASC');

    if (type) qb.andWhere('tx.type = :type', { type });

    const result = await qb.getRawMany();
    const assets = [...new Set(result.map((r) => r.asset))];
    const dateSet = [...new Set(result.map((r) => r.date))];

    const dataset = dateSet.map((date) => {
      const dayRecords = result.filter((r) => r.date === date);
      const entry: any = { date };

      assets.forEach((asset) => {
        const record = dayRecords.find((r) => r.asset === asset);
        entry[asset] = record ? Number(record.totalAmount ?? 0) : 0;
      });

      return entry;
    });

    return { assets, days: dateSet, dataset };
  }

  /* 🧩 COMBINED DASHBOARD ANALYTICS */
  async getDashboardAnalytics() {
    const [
      summary,


    ] = await Promise.all([
      this.getUserSummary(),
   

    ]);

    return {
      summary,

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