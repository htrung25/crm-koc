import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  ECampaignActorType,
  ECampaignStatus,
  ECompensationType,
} from '../../../common/enum/campaign.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';
import { Campaign } from '../entities/campaign.entity';
import { CampaignAsset } from '../entities/campaign-asset.entity';
import { CampaignCategory } from '../entities/campaign-category.entity';
import { CampaignDeliverable } from '../entities/campaign-deliverable.entity';

/** Quyền lợi hiện vật. Chỉ có nghĩa khi compensationType là PRODUCT/HYBRID. */
export interface CampaignProductBenefit {
  description: string;
  quantity: number;
  delivery: string;
}

/** Đơn vị tuỳ contentType: giây cho video, chữ cho bài viết. Để mở một đầu được. */
export interface CampaignDeliverableDuration {
  unit: string;
  min: number | null;
  max: number | null;
}

export interface CampaignSnapshot {
  campaign: Record<string, unknown>;
  deliverables: Record<string, unknown>[];
  assets: Record<string, unknown>[];
}

/** Chính sách đang áp lúc gửi. Số tiền lưu chuỗi vì jsonb dùng double. */
export interface CampaignAppliedPolicy {
  capturedAt: string;
  cashFloor: { value: string | null; sourceKey: string | null };
  category: { id: string | null; policy: string | null };
}

export interface CashFloorInput {
  compensationType: ECompensationType;
  platform?: ESocialPlatform | null;
  contentType?: string | null;
}

export interface CashFloorResolution {
  /** null = không áp sàn tiền mặt (campaign chỉ trả bằng sản phẩm). */
  value: bigint | null;
  /** Khoá đã dùng. Đi kèm value để thông báo lỗi giải thích được. */
  sourceKey: string | null;
}

/**
 * `draft` biến mọi phát hiện thành warnings và không chặn; `submit` biến chúng
 * thành errors. Cùng một bộ luật, khác đúng mức nghiêm khắc.
 */
export type CampaignValidationMode = 'draft' | 'submit';

export interface CampaignIssue {
  /** Tên constraint cho lỗi field, tên hằng EBusinessCode cho luật nghiệp vụ. */
  code: string;
  fieldPath: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignValidationResult {
  errors: CampaignIssue[];
  warnings: CampaignIssue[];
}

export interface CampaignValidationInput {
  campaign: Campaign;
  deliverables: CampaignDeliverable[];
  assets: CampaignAsset[];
  category: CampaignCategory | null;
  /** Nhóm cấu hình `campaign` đã nạp sẵn, để resolver không tự đi truy vấn. */
  config: Record<string, unknown>;
}

/** Ai gây ra chuyển trạng thái. id null chỉ hợp lệ với SYSTEM. */
export interface CampaignActor {
  type: ECampaignActorType;
  id: string | null;
}

/* Cột được phép đổi kèm transition: submittedAt, approvedAt, cancelReasonCode...*/
export type CampaignTransitionPatch = Omit<
  QueryDeepPartialEntity<Campaign>,
  'id' | 'brandId' | 'status' | 'version'
>;

export interface CampaignTransitionInput {
  campaignId: string;
  /** Truyền khi actor là brand: ràng quyền sở hữu ngay trong câu UPDATE. */
  brandId?: string;
  /** Bỏ trống cho SYSTEM — scheduler không đọc trước nên không có version. */
  expectedVersion?: number;
  expectedStatus: ECampaignStatus;
  next: ECampaignStatus;
  actor: CampaignActor;
  patch?: CampaignTransitionPatch;
  reasonCode?: string;
  note?: string;
  correlationId?: string;
}
