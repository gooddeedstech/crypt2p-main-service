import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() @Index() userId: string
  @Column() codeHash: string

  @Column({ type: 'timestamptz' }) expiresAt: Date
  @Column({ default: false }) used: boolean
  @CreateDateColumn() createdAt: Date
}
