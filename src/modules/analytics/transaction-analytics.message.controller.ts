import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransactionAnalyticsService } from './transaction-analytics.service';
import {
  CryptoTransactionType,
  CryptoTransactionStatus,
} from '@/entities/crypto-transaction.entity';

@Controller()
export class TransactionAnalyticsMessageController {
  constructor(
    private readonly analyticsService: TransactionAnalyticsService,
  ) {}

  /* -----------------------------------------------------------
   📊 MAIN DASHBOARD
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.transactions.dashboard' })
  async dashboard(
    @Payload()
    payload: {
      date?: 'today' | 'week' | 'month' | 'year';
      type?: CryptoTransactionType;
      asset?: string;
    },
  ) {
    return this.analyticsService.getDashboardSummary(payload);
  }

  /* -----------------------------------------------------------
   🪙 SUMMARY BY ASSET
  ------------------------------------------------------------*/
  @MessagePattern({ cmd: 'analytics.transactions.by-asset' })
  async summaryByAsset(
    @Payload()
    payload: {
      date?: 'today' | 'week' | 'month' | 'year';
      type?: CryptoTransactionType;
    },
  ) {
    return this.analyticsService.getSummaryByAsset(payload);
  }

  /* -----------------------------------------------------------
   📜 LOGS
  ------------------------------------------------------------*/
 @MessagePattern({ cmd: 'analytics.transactions.logs' })
async logs(
  @Payload()
  payload: {
    startDate?: string;
    endDate?: string;
    type?: CryptoTransactionType;
    asset?: string;
    status?: CryptoTransactionStatus;
    page?: number;
    limit?: number;
  },
) {
  return this.analyticsService.getTransactionLogs(payload);
}
}