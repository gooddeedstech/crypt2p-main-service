import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

/** ✅ Enumerations for Device Management */
export enum DeviceType {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

@Entity('user_devices')
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 🔗 Relationship to User */
  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** 📱 Firebase Cloud Messaging Token */
  @Column({ type: 'text', unique: true })
  fcmToken: string;

  /** 🧠 Device Info */
  @Column({ type: 'enum', enum: DeviceType })
  deviceType: DeviceType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceName?: string; // e.g. "iPhone 15 Pro" or "Samsung S24 Ultra"

  @Column({ type: 'varchar', length: 50, nullable: true })
  osVersion?: string; // e.g. "iOS 18.0" or "Android 15"

  /** 🚦 Device Status */
  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.ACTIVE })
  status: DeviceStatus;

  /** 🌍 Last IP or Location (optional) */
  @Column({ type: 'varchar', length: 64, nullable: true })
  lastIp?: string;

  /** 🕒 Activity Tracking */
  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}