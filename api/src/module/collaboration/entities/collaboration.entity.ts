import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';
import { BrandProfile } from '../../brand/entities/brand-profile.entity';
import { CreatorProfile } from '../../creator/entities/creator-profile.entity';

@Index('idx_collaborations_brand_status', ['brandId', 'status'])
@Index('idx_collaborations_creator_status', ['creatorId', 'status'])
@Entity('collaborations')
export class Collaboration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  brandId: string;

  @ManyToOne(() => BrandProfile, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandProfile;

  @Column({ type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => CreatorProfile, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'creator_id' })
  creator?: CreatorProfile;

  /** Chưa có bảng campaigns nên chưa có quan hệ, chỉ giữ id trần. */
  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: ECollaborationStatus.PENDING,
  })
  status: ECollaborationStatus;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  agreedPrice: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
