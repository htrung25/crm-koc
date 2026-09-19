import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ECampaignContentType } from '../../../common/enum/campaign.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';

/** Đơn vị tuỳ contentType: giây cho video, chữ cho bài viết. Để mở một đầu được. */
export interface CampaignDeliverableDuration {
  unit: string;
  min: number | null;
  max: number | null;
}

@Entity('campaign_deliverables')
export class CampaignDeliverable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  /** Server gán theo thứ tự trong payload. Xoá dòng KHÔNG dồn lại số. */
  @Column({ type: 'smallint' })
  position: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  contentType: ECampaignContentType | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  platform: ESocialPlatform | null;

  @Column({ type: 'smallint', nullable: true })
  quantity: number | null;

  @Column({ type: 'jsonb', nullable: true })
  durationOrLength: CampaignDeliverableDuration | null;

  @Column({ type: 'text', nullable: true })
  formatRequirements: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  contentSubmissionDeadline: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishDeadline: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
