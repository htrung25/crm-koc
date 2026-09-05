import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import {
  ECampaignActorType,
  ECampaignStatus,
} from '../../../common/enum/campaign.enum';
import { Campaign } from '../entities/campaign.entity';

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
