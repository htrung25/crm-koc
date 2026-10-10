import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

// Ký quỹ của một campaign: tiền brand đã trả, chờ chi cho creator hoặc hoàn lại.
@Entity('campaign_escrows')
export class Escrow {
  @PrimaryColumn({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'uuid' })
  brandId: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  heldAmount: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
