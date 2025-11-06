import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() @Index() userId: string
  @Column() tokenHash: string

  @Column({ type: 'timestamptz' }) expiresAt: Date
  @CreateDateColumn() createdAt: Date
}
