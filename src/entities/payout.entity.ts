import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { Deposit } from './deposit.entity'

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() userId: string
  @ManyToOne(() => User, u => u.payouts, { onDelete: 'CASCADE' }) user: User

  @Column() depositId: string
  @ManyToOne(() => Deposit, d => d.id, { onDelete: 'CASCADE' }) deposit: Deposit

  @Column('decimal', { precision: 38, scale: 2 }) amountNgn: string
  @Column({ nullable: true, unique: true }) paystackRef?: string
  @Column({ default: 'PROCESSING' }) status: string
  @Column({ nullable: true }) failureReason?: string

  @CreateDateColumn() createdAt: Date
  @UpdateDateColumn() updatedAt: Date
}
