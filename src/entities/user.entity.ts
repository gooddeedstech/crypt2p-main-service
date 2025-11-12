import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { randomBytes } from 'crypto';
import { CryptoTransaction } from './crypto-transaction.entity';
import { BankDetail } from './bank-detail.entity';
import { LoginLog } from './login-log.entity';
import { UserWallet } from './user-wallet.entity';
import { UserDevice } from './user-device.entity';

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

  @Column({ nullable: true })
  virtualAccountNumber?: string;

  // ✅ Referral System
  @Index()
  @Column({ unique: true, nullable: true })
  referralCode: string;

  @Column({ nullable: true })
  rewardPoint?: string;

  @BeforeInsert()
  generateReferralCode() {
    const random = randomBytes(3).toString('hex').toUpperCase();
    const prefix = 'C2P-';
    this.referralCode = `${prefix}${random.substring(0, 6)}`;
  }

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
  @OneToMany(() => BankDetail, (b) => b.user)
  bankAccounts: BankDetail[];

  @OneToMany(() => UserWallet, (w) => w.user)
  wallets: UserWallet[];

  @OneToMany(() => CryptoTransaction, (d) => d.user_id)
  transactions: CryptoTransaction[];

  @OneToMany(() => LoginLog, (log) => log.user)
  loginLogs: LoginLog[];

  @OneToMany(() => UserDevice, (d) => d.user)
  devices: UserDevice[];

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

  // ✅ Audit
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}