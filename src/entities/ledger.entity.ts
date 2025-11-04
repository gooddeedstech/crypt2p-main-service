import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() userId: string
  @ManyToOne(() => User, u => u.ledger, { onDelete: 'CASCADE' }) user: User

  @Column() type: string
  @Column() currency: string
  @Column('decimal', { precision: 38, scale: 18 }) amount: string
  @Column('jsonb', { nullable: true }) meta?: any

  @CreateDateColumn() createdAt: Date
}
