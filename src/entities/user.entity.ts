import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Deposit } from './deposit.entity';
import { Payout } from './payout.entity';
import { LedgerEntry } from './ledger.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum KycLevel {
  UNVERIFIED = 0,
  BASIC = 1,
  FULL = 2,
}

export enum BvnStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ Identity
  @Index()
  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index()
  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  country: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // ✅ Auth
  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  pinHash?: string;

  @Column({ default: false })
  pinEnabled: boolean;

  // ✅ Account status
  @Column({ default: false })
  isDisabled: boolean;

  @Column({ default: 0 })
  failedPinAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  pinLockedUntil?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  // ✅ Paystack Integration
  @Column({ nullable: true })
  paystackCustomerCode?: string;

  @Column({ nullable: true })
  virtualAccountNumber?: string;

  @Column({ nullable: true })
  bankName?: string;

  // ✅ Payout Banking
  @Column({ nullable: true })
  bankAccountNo?: string;

  @Column({ nullable: true })
  bankCode?: string;

  // ✅ KYC & BVN Verification
  @Column({ type: 'enum', enum: KycLevel, default: KycLevel.UNVERIFIED })
  kycLevel: KycLevel;

  @Column({ type: 'enum', enum: BvnStatus, default: BvnStatus.PENDING })
  bvnStatus: BvnStatus;

  @Column({ nullable: true })
  bvnFailureReason?: string; // 🆕 Why verification failed

  @Column({ type: 'timestamptz', nullable: true })
  bvnLastCheckedAt?: Date | null;

  // ✅ Wallet + Financial Records
  @OneToMany(() => Wallet, (w) => w.user)
  wallets: Wallet[];

  @OneToMany(() => Deposit, (d) => d.user)
  deposits: Deposit[];

  @OneToMany(() => Payout, (p) => p.user)
  payouts: Payout[];

  @OneToMany(() => LedgerEntry, (l) => l.user)
  ledger: LedgerEntry[];

  // ✅ Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}