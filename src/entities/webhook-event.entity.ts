import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid') id: string

  @Column() @Index() provider: string
  @Column() @Index() eventType: string

  @Column('jsonb') payload: any
  @Column() signature: string
  @Column({ nullable: true }) idempotencyKey?: string
  @Column({ default: 'RECEIVED' }) status: string

  @CreateDateColumn() createdAt: Date
}
