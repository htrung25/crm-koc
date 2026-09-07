import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  EReviewDecision,
  EReviewSubmissionStatus,
} from '../../../common/enum/campaign.enum';
import type {
  CampaignAppliedPolicy,
  CampaignSnapshot,
} from '../types/campaign.types';

@Entity('campaign_review_submissions')
export class CampaignReviewSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  /** Tăng tuần tự trong phạm vi một campaign, bắt đầu từ 1. */
  @Column({ type: 'integer' })
  revisionNumber: number;

  @Column({ type: 'integer' })
  campaignVersion: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: EReviewSubmissionStatus.OPEN,
  })
  status: EReviewSubmissionStatus;

  /** Bản chụp theo giá trị, KHÔNG phải tham chiếu tới campaign đang sống. */
  @Column({ type: 'jsonb' })
  snapshot: CampaignSnapshot;

  /** Giá sàn và category policy đang áp tại thời điểm gửi. */
  @Column({ type: 'jsonb' })
  appliedPolicy: CampaignAppliedPolicy;

  @Column({ type: 'uuid' })
  submittedBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt: Date;

  @Column({ type: 'varchar', length: 32, nullable: true })
  decision: EReviewDecision | null;

  @Column({ type: 'uuid', nullable: true })
  decidedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decidedAt: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reasonCode: string | null;

  /** Kết quả automated check + checklist thủ công, ghi lúc admin quyết. */
  @Column({ type: 'jsonb', nullable: true })
  checklistResult: unknown;

  /** Danh sách field/checklist admin yêu cầu sửa. */
  @Column({ type: 'jsonb', nullable: true })
  feedbackItems: unknown;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
