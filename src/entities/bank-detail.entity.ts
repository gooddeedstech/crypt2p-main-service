import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { CryptoTransaction } from './crypto-transaction.entity';

@Entity('bank_details')
export class BankDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.bankAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 150 })
  bankName: string;

  @Column({ type: 'varchar', length: 20 })
  bankCode: string;

  @Column({ type: 'varchar', length: 20 })
  accountNumber: string;

  @Column({ type: 'varchar', length: 100 })
  accountName: string;

  @Column({ default: false })
  isPrimary: boolean;

  @OneToMany(() => CryptoTransaction, (tx) => tx.bank)
  transactions: CryptoTransaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}