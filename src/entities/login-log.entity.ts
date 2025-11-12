import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LoginMethod {
  PASSWORD = 'PASSWORD',
  PIN = 'PIN',
  OAUTH = 'OAUTH',
  ADMIN = 'ADMIN',
}

export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('login_logs')
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: LoginMethod })
  method: LoginMethod;

  @Column({ type: 'enum', enum: LoginStatus })
  status: LoginStatus;

  @Column({ type: 'text', nullable: true })
  failure_reason?: string;

  @CreateDateColumn()
  created_at: Date;
}