import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ECampaignAssetKind } from '../../../common/enum/campaign.enum';

@Entity('campaign_assets')
export class CampaignAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'varchar', length: 32 })
  kind: ECampaignAssetKind;

  /** Thứ tự trong cùng một kind. Xoá dòng KHÔNG dồn lại số. */
  @Column({ type: 'smallint' })
  position: number;

  /** Khoá trong R2, sinh ngẫu nhiên: không đoán được từ id campaign. */
  @Column({ type: 'text' })
  storageKey: string;

  /** Tên người dùng đặt, CHỈ để hiển thị. Không bao giờ dùng làm đường dẫn. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalName: string | null;

  /** Lấy từ magic bytes, không tin đuôi tên lẫn Content-Type của client. */
  @Column({ type: 'varchar', length: 64 })
  mimeType: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  @Column({ type: 'char', length: 64 })
  checksum: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
