import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AssetType {
  COIN = 'COIN',
  TOKEN = 'TOKEN',
  STABLECOIN = 'STABLECOIN',
}

export interface NetworkOption {
  name: string;  // e.g. "USDT-BEP20 (BSC)"
  value: string; // e.g. "BEP20"
}

@Entity({ name: 'assets' })
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string; // ✅ Unique ID for each asset

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string; // e.g., "USDT"

  @Column({ type: 'varchar', length: 64 })
  description: string; // e.g., "Tether USD"

  @Column({ type: 'enum', enum: AssetType })
  type: AssetType; // e.g., STABLECOIN | COIN

  // 🧩 Store multiple network options as JSON
  @Column({ type: 'jsonb', nullable: false })
  networks: NetworkOption[]; // [{ name: "USDT-BEP20 (BSC)", value: "BEP20" }, ...]

  @Column({ type: 'int', default: 18 })
  decimals: number; // e.g., 18 for ETH, 6 for USDT

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

   @Column({ type: 'int', nullable: true})
  margin: number;

   @Column({ type: 'int', nullable: true})
  order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}