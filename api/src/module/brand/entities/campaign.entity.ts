import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ECampaignObjective,
  ECampaignStatus,
  ECompensationType,
  EPricingModel,
  EUsageRightsKind,
} from '../../../common/enum/campaign.enum';
import { ECreatorContent } from '../../../common/enum/creator-content.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';
import { CampaignProductBenefit } from '../types/campaign.types';
import { BrandProfile } from './brand-profile.entity';
import { CampaignCategory } from './campaign-category.entity';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  brandId: string;

  @ManyToOne(() => BrandProfile, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand?: BrandProfile;

  /** Mã người đọc được, dùng để tìm kiếm. Sinh ngẫu nhiên, không theo sequence. */
  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'smallint', default: ECampaignStatus.DRAFT })
  status: ECampaignStatus;

  /**
   * KHÔNG dùng @VersionColumn: nó chỉ tăng khi save() thấy có cột đổi, nên một
   * transition chỉ đổi status sẽ không tăng version và mất luôn lớp chống ghi
   * đè. Cột này do câu UPDATE có điều kiện tự tăng.
   */
  @Column({ type: 'integer', default: 1 })
  version: number;

  /** Bước wizard gần nhất, để mở lại đúng chỗ đang dở. */
  @Column({ type: 'smallint', nullable: true })
  wizardStep: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  objective: ECampaignObjective | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => CampaignCategory, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category?: CampaignCategory;

  /** Rich text đã sanitize. Độ dài đo trên nội dung SAU sanitize. */
  @Column({ type: 'text', nullable: true })
  productDescription: string | null;

  @Column({ type: 'text', nullable: true })
  keyMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  sellingPoints: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  prohibitedContent: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  requiredHashtags: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  requiredMentions: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  requiredLinks: string[] | null;

  @Column({ type: 'smallint', nullable: true })
  creatorCount: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  recruitingStartAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  applicationDeadline: Date | null;

  /** Mảng rỗng = không giới hạn, không phải dữ liệu còn thiếu. */
  @Column({ type: 'text', array: true, default: '{}' })
  creatorContentCategories: ECreatorContent[];

  /**
   * Nền tảng Creator phải CÓ TÀI KHOẢN, khác với nơi công việc phải đăng
   * (deliverable.platform) và bao hàm tập đó. Ràng buộc cross-table nên kiểm ở
   * tầng validation, không phải CHECK.
   */
  @Column({ type: 'text', array: true, default: '{}' })
  creatorPlatforms: ESocialPlatform[];

  /** bigint => driver trả về string, không phải number. Khai string là đúng. */
  @Column({ type: 'bigint', nullable: true })
  creatorMinFollowers: string | null;

  /** numeric cũng trả về string. Precision khớp social_accounts. */
  @Column({ type: 'numeric', precision: 8, scale: 4, nullable: true })
  creatorMinEngagementRate: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  creatorCities: string[];

  /** Không có đối trọng dữ liệu nào phía Creator nên chỉ là mô tả. */
  @Column({ type: 'text', nullable: true })
  creatorAudienceNote: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  compensationType: ECompensationType | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  pricingModel: EPricingModel | null;

  // Tiền là integer VND (bigint), KHÔNG numeric có phần thập phân.
  @Column({ type: 'bigint', nullable: true })
  cashUnitPrice: string | null;

  @Column({ type: 'bigint', nullable: true })
  minCashUnitPrice: string | null;

  @Column({ type: 'bigint', nullable: true })
  maxCashUnitPrice: string | null;

  /** Dẫn xuất: creatorCount × cashUnitPrice khi pricing FIXED. Client không ghi. */
  @Column({ type: 'bigint', nullable: true })
  cashBudget: string | null;

  @Column({ type: 'jsonb', nullable: true })
  productBenefit: CampaignProductBenefit | null;

  @Column({ type: 'text', nullable: true })
  usageRightsScope: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  usageRightsKind: EUsageRightsKind | null;

  /** Bắt buộc khi usageRightsKind = FIXED; kiểm ở tầng gửi duyệt. */
  @Column({ type: 'timestamptz', nullable: true })
  usageRightsUntil: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellationPolicy: string | null;

  /** Lần gửi duyệt gần nhất. Gửi lại thì ghi đè. */
  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  /** DB có CHECK: chỉ campaign đã huỷ mới có mốc này, và ngược lại. */
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  cancelReasonCode: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
