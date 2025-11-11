import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fees')
export class Fee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 10 })
  asset: string; // e.g., USDT, BTC

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  fee: number; // e.g., 0.5 for 0.5%

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}