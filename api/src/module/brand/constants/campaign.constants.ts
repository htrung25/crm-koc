import { ECampaignStatus } from '../../../common/enum/campaign.enum';

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
