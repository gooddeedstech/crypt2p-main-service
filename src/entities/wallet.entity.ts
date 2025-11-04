import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm'
import { User } from './user.entity'

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() asset: string
  @Column({ default: 'default' }) network: string

  @Column({ unique: true }) @Index() address: string
  @Column({ nullable: true }) providerRef?: string

  @ManyToOne(() => User, u => u.wallets, { onDelete: 'CASCADE' }) user: User
}
