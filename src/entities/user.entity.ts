import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Wallet } from './wallet.entity'
import { Deposit } from './deposit.entity'
import { Payout } from './payout.entity'
import { LedgerEntry } from './ledger.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column({ unique: true }) email: string
  @Column({ nullable: true }) fullName?: string
  @Column() passwordHash: string

  @Column({ nullable: true }) bankAccountNo?: string
  @Column({ nullable: true }) bankCode?: string

  @OneToMany(() => Wallet, w => w.user) wallets: Wallet[]
  @OneToMany(() => Deposit, d => d.user) deposits: Deposit[]
  @OneToMany(() => Payout, p => p.user) payouts: Payout[]
  @OneToMany(() => LedgerEntry, l => l.user) ledger: LedgerEntry[]
}
