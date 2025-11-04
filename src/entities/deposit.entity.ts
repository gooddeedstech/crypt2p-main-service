import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { User } from './user.entity'

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() userId: string
  @ManyToOne(() => User, u => u.deposits, { onDelete: 'CASCADE' }) user: User

  @Column() asset: string
  @Column() network: string

  @Column({ unique: true }) @Index() txHash: string

  @Column('decimal', { precision: 38, scale: 18 }) amountAsset: string
  @Column('decimal', { precision: 38, scale: 2, nullable: true }) amountNgn: string | null

  @Column({ default: 0 }) confirmations: number
  @Column({ default: 'PENDING' }) status: string
  @Column({ nullable: true }) bushaRef?: string

  @CreateDateColumn() createdAt: Date
  @UpdateDateColumn() updatedAt: Date
}
