import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ConfigStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  setting: string; // e.g. "ALLOW_WITHDRAWALS", "ENABLE_2FA"

   @Column({ type: 'int', nullable: true })
  ngnValue?: number; 

     @Column({ type: 'int', nullable: true })
  usdValue?: number; 

  @Column({
    type: 'enum',
    enum: ConfigStatus,
    default: ConfigStatus.ENABLED,
  })
  status: ConfigStatus;

  @Column({ type: 'text', nullable: true })
  description?: string; // optional human-readable explanation

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}