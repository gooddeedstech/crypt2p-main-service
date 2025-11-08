import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DepositStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum DepositType {
  CRYPTO_TO_CASH = 'CRYPTO_TO_CASH',
  CASH_TO_CRYPTO = 'CASH_TO_CRYPTO',
}

@Entity('crypto_deposits')
export class CryptoDeposit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column({ type: 'varchar', length: 10 })
  asset: string; // e.g. BTC, USDT

  @Column({ type: 'varchar', length: 20 })
  network: string; // e.g. ERC20, BTC

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  quote_id: string;

  @Column({ type: 'varchar', nullable: true })
  transfer_id: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.PENDING })
  status: DepositStatus;

  @Column({ type: 'enum', enum: DepositType, default: DepositType.CRYPTO_TO_CASH })
  type: DepositType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

   @Column({ nullable: true })
  confirmed_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}