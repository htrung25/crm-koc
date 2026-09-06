import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ECampaignActorType,
  ECampaignStatus,
} from '../../../common/enum/campaign.enum';

/**
 * Vết mỗi lần campaign đổi trạng thái. Chỉ ghi thêm, không sửa không xoá —
 * tầng service chỉ để lộ đúng một hàm append().
 */
@Entity('campaign_status_history')
export class CampaignStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  /** NULL cho bản ghi khai sinh: chưa có trạng thái nào trước đó. */
  @Column({ type: 'smallint', nullable: true })
  fromStatus: ECampaignStatus | null;

  @Column({ type: 'smallint' })
  toStatus: ECampaignStatus;

  @Column({ type: 'integer', nullable: true })
  beforeVersion: number | null;

  @Column({ type: 'integer' })
  afterVersion: number;

  @Column({ type: 'varchar', length: 32 })
  actorType: ECampaignActorType;

  /** NULL khi actorType là SYSTEM. DB có CHECK ràng buộc hai chiều. */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  reasonCode: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'uuid', nullable: true })
  correlationId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
