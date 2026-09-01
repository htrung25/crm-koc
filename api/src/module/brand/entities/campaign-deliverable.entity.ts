import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ECampaignContentType } from '../../../common/enum/campaign.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';
import { CampaignDeliverableDuration } from '../types/campaign.types';

/** Yêu cầu nội dung cho MỘT Creator: ai nhận slot phải làm hết các dòng này. */
@Index('UQ_campaign_deliverables_position', ['campaignId', 'position'], {
  unique: true,
})
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

  /**
   * Nơi công việc phải đăng. Khác Campaign.creatorPlatforms — cái kia là nền
   * tảng Creator phải có tài khoản, và phải bao hàm tập này.
   */
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
