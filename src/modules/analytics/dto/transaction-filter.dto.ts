import { ApiPropertyOptional } from '@nestjs/swagger';
import { CryptoTransactionType, CryptoTransactionStatus } from '@/entities/crypto-transaction.entity';

export class TransactionFilterDto {
  @ApiPropertyOptional({
    enum: ['today', 'week', 'month', 'year'],
    description: 'Date range filter',
  })
  date?: 'today' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({
    enum: CryptoTransactionType,
    description: 'Transaction type: CRYPTO_TO_CASH or CASH_TO_CRYPTO',
  })
  type?: CryptoTransactionType;

  @ApiPropertyOptional({ description: 'Filter by asset e.g. USDT, BTC' })
  asset?: string;

  @ApiPropertyOptional({
    enum: CryptoTransactionStatus,
    description: 'Transaction status filter',
  })
  status?: CryptoTransactionStatus;
}