import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BankDetail } from './bank-detail.entity';
import { User } from './user.entity'; // ✅ import user

export enum CryptoTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ExchangeTransactionStatus {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export enum CryptoTransactionType {
  CRYPTO_TO_CASH = 'CRYPTO_TO_CASH',
  CASH_TO_CRYPTO = 'CASH_TO_CRYPTO',
}

@Entity('crypto_transactions')
export class CryptoTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  user_id: string;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User; // ✅ added proper relation to User

  @Column({ type: 'varchar', length: 10 })
  asset: string; // e.g. BTC, USDT

  @Column({ type: 'varchar', length: 20 })
  network: string; // e.g. ERC20, BTC

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  exchangeRate?: number; // NGN/crypto rate at transaction time 

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  convertedAmount: number;

  @Column({ type: 'varchar', nullable: true })
  quote_id: string;

  @Column({ type: 'varchar', nullable: true })
  transfer_id: string;

  @Column({ nullable: true })
  bank_id: string;

  @ManyToOne(() => BankDetail, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bank_id' })
  bank: BankDetail;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({
    type: 'enum',
    enum: CryptoTransactionStatus,
    default: CryptoTransactionStatus.PENDING,
  })
  status: CryptoTransactionStatus;

  @Column({
    type: 'enum',
    enum: CryptoTransactionType,
    default: CryptoTransactionType.CRYPTO_TO_CASH,
  })
  type: CryptoTransactionType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  confirmed_at?: Date;

  @Column({
    type: 'enum',
    enum: ExchangeTransactionStatus,
    default: ExchangeTransactionStatus.PENDING,
  })
  exchange_status: ExchangeTransactionStatus;

  @Column({ nullable: true })
  exchange_confirmed_at?: Date;

  @Column({ type: 'jsonb', nullable: true })
  exchange_data?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}