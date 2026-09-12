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
// Đồng bộ với OPEN_STATUSES và migration AddOpenCollaborationUniqueness.
@Index(
  'UQ_collaborations_open_campaign',
  ['brandId', 'creatorId', 'campaignId'],
  {
    unique: true,
    where: '"campaign_id" IS NOT NULL AND "status" IN (1, 2, 3)',
  },
)
@Index('UQ_collaborations_open_direct', ['brandId', 'creatorId'], {
  unique: true,
  where: '"campaign_id" IS NULL AND "status" IN (1, 2, 3)',
})
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

  @Column({ type: 'uuid', nullable: true })
  campaignId: string | null;

  @Column({ type: 'smallint', default: ECollaborationStatus.PENDING })
  status: ECollaborationStatus;

  @Column({ type: 'bigint', nullable: true })
  agreedPrice: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  /** Lúc creator nộp bài, chờ brand duyệt. */
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
