import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserAnalyticsService } from './user-analytics.service';
import { CryptoTransactionType } from '@/entities/crypto-transaction.entity';

@Controller()
export class AnalyticsMessageController {
  private readonly logger = new Logger(AnalyticsMessageController.name);

  constructor(private readonly userAnalyticsService: UserAnalyticsService) {}

  /* -----------------------------------------------------------
   ✅ MAIN DASHBOARD ANALYTICS
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.dashboard' })
  async handleDashboard() {

    return await this.userAnalyticsService.getDashboardAnalytics();
  }

  /* -----------------------------------------------------------
   👥 USER REGISTRATION TREND
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.users.trend' })
  async handleUserTrend(@Payload() payload: { days?: number }) {
    const days = payload?.days ?? 30;
    return await this.userAnalyticsService.getDailyRegistrationStats(days);
  }

  /* -----------------------------------------------------------
   🧍‍♂️ TOP ACTIVE USERS
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.users.top-active' })
  async handleTopActiveUsers(@Payload() payload?: { type?: CryptoTransactionType }) {
    const { type } = payload || {};
    return await this.userAnalyticsService.getTopActiveUsers(type);
  }

  /* -----------------------------------------------------------
   💸 TOP USERS BY TRANSACTION VOLUME
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.users.top-volume' })
  async handleTopVolumeUsers(@Payload() payload?: { type?: CryptoTransactionType }) {
    const { type } = payload || {};
    return await this.userAnalyticsService.getTopUsersByTransactionVolume(type);
  }

  /* -----------------------------------------------------------
   🪙 TRANSACTION SUMMARY BY ASSET & DAYS
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.transactions.by-asset-days' })
  async handleTransactionSummaryByAssetAndDays(
    @Payload() payload: { days?: number; type?: CryptoTransactionType },
  ) {
    const days = payload?.days ?? 7;
    const { type } = payload;
    return await this.userAnalyticsService.getTransactionSummaryByAssetAndDays(days, type);
  }


  /* -----------------------------------------------------------
     📈 DAILY TRANSACTION TREND
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.transactions.trend' })
  async trend(
    @Payload() payload: { days?: number; type?: CryptoTransactionType },
  ) {
    const days = payload?.days ?? 7;
    return await this.userAnalyticsService.getDailyTransactionTrend(
      days,
      payload?.type,
    );
  }

  /* -----------------------------------------------------------
     🪙 TRANSACTION SUMMARY BY ASSET GROUPED BY DAYS
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.transactions.asset-days-group' })
  async assetGrouped(
    @Payload() payload: { days?: number; type?: CryptoTransactionType },
  ) {
    const days = payload?.days ?? 7;
    return await this.userAnalyticsService.getTransactionSummaryByAssetByDays(
      days,
      payload?.type,
    );
  }
}