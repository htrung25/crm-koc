import {
  ECampaignActorType,
  ECampaignStatus,
} from '../../../common/enum/campaign.enum';

/** Chưa kết thúc: còn chiếm chỗ trong hạn mức của brand. */
export const UNFINISHED_CAMPAIGN_STATUSES = [
  ECampaignStatus.DRAFT,
  ECampaignStatus.PENDING_APPROVAL,
  ECampaignStatus.CHANGES_REQUESTED,
  ECampaignStatus.REJECTED,
];

export const MAX_UNFINISHED_CAMPAIGNS_PER_BRAND = 50;

export const CAMPAIGN_CODE_PREFIX = 'CMP-';
export const CAMPAIGN_CODE_LENGTH = 8;

/**
 * Crockford base32: bỏ I, L, O, U để không đọc nhầm khi trao đổi qua điện
 * thoại hay chat. 32 ký tự chia hết 256 nên lấy `byte % 32` không lệch phân bố.
 */
export const CAMPAIGN_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 32^8 ≈ 1.1e12 nên đụng mã là hi hữu; vài lượt thử là quá đủ. */
export const CAMPAIGN_CODE_MAX_ATTEMPTS = 5;

/** Giữ khoá idempotency đủ lâu để bao trọn một phiên làm việc của brand. */
export const CAMPAIGN_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export const CAMPAIGN_IDEMPOTENCY_HEADER = 'Idempotency-Key';

/** Header đi thẳng vào key Redis nên phải có trần, không nhận chuỗi tuỳ ý. */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

/** Enum là số nên thông điệp lỗi phải tự dịch, không thì FE nhận "2" trơ trọi. */
export const CAMPAIGN_STATUS_LABEL: Record<ECampaignStatus, string> = {
  [ECampaignStatus.DRAFT]: 'draft',
  [ECampaignStatus.PENDING_APPROVAL]: 'pending_approval',
  [ECampaignStatus.CHANGES_REQUESTED]: 'changes_requested',
  [ECampaignStatus.REJECTED]: 'rejected',
  [ECampaignStatus.APPROVED]: 'approved',
  [ECampaignStatus.CANCELLED]: 'cancelled',
};

export const ALL_CAMPAIGN_STATUSES = Object.values(ECampaignStatus).filter(
  (value): value is ECampaignStatus => typeof value === 'number',
);

/**
 * Chuyển trạng thái hợp lệ và ai được phép.
 *
 * Chưa có dòng nào cho SYSTEM: scheduler chỉ xuất hiện ở nửa tuyển dụng, phần
 * còn đang chờ chốt phạm vi. Giữ actor trong kiểu để không phải sửa chữ ký khi
 * thêm.
 */
export const CAMPAIGN_TRANSITIONS: Record<
  ECampaignStatus,
  Partial<Record<ECampaignStatus, ECampaignActorType[]>>
> = {
  [ECampaignStatus.DRAFT]: {
    [ECampaignStatus.PENDING_APPROVAL]: [ECampaignActorType.BRAND],
    [ECampaignStatus.CANCELLED]: [ECampaignActorType.BRAND],
  },
  [ECampaignStatus.PENDING_APPROVAL]: {
    // Brand rút về nháp khi admin chưa ra quyết định.
    [ECampaignStatus.DRAFT]: [ECampaignActorType.BRAND],
    [ECampaignStatus.CHANGES_REQUESTED]: [ECampaignActorType.ADMIN],
    [ECampaignStatus.REJECTED]: [ECampaignActorType.ADMIN],
    [ECampaignStatus.APPROVED]: [ECampaignActorType.ADMIN],
    [ECampaignStatus.CANCELLED]: [ECampaignActorType.BRAND],
  },
  [ECampaignStatus.CHANGES_REQUESTED]: {
    [ECampaignStatus.PENDING_APPROVAL]: [ECampaignActorType.BRAND],
    [ECampaignStatus.CANCELLED]: [ECampaignActorType.BRAND],
  },
  [ECampaignStatus.REJECTED]: {
    // Từ chối KHÔNG phải cửa đóng vĩnh viễn: brand sửa rồi gửi lại được.
    [ECampaignStatus.PENDING_APPROVAL]: [ECampaignActorType.BRAND],
    [ECampaignStatus.CANCELLED]: [ECampaignActorType.BRAND],
  },
  [ECampaignStatus.APPROVED]: {
    // Sửa trường cam kết cốt lõi làm mất hiệu lực phê duyệt, campaign về nháp.
    [ECampaignStatus.DRAFT]: [ECampaignActorType.BRAND],
    [ECampaignStatus.CANCELLED]: [ECampaignActorType.BRAND],
  },
  [ECampaignStatus.CANCELLED]: {},
};
