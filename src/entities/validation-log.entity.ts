import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('validation_logs')
export class ValidationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  validationType: string;

  @Column({ nullable: true })
  bvn?: string;

  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ nullable: true })
  bankCode?: string;

  @Column({ type: 'jsonb', nullable: true })
  response?: any;

  @CreateDateColumn()
  dateCreated: Date;
}