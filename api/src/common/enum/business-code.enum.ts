/* Dải số, chừa chỗ mở rộng theo miền:
 *   0            thành công
 *   -1           lỗi không phân loại được
 *   1000-1999    auth (token, OTP, phiên)
 *   2000-2999    admin / ip whitelist
 *   3000-3999    collaboration
 *   4000-4999    creator / social
 *   5000-5999    hệ thống / vận hành
 *   6000-6999    kyc
 *   7000-7999    campaign
 */
export enum EBusinessCode {
  SUCCESS = 0,
  UNKNOWN_ERROR = -1,

  DEVICE_MISMATCH = 1000,

  INVALID_IP_FORMAT = 2000,
  INVALID_CIDR_FORMAT = 2001,
  IP_WHITELIST_WOULD_LOCK_YOU_OUT = 2002,

  SYSTEM_UNDER_MAINTENANCE = 5000,

  KYC_ALREADY_SUBMITTED = 6000,
  /** Hết 3 lượt nộp, phải qua support. */
  KYC_ATTEMPTS_EXHAUSTED = 6001,
  /** Chức năng yêu cầu KYC đã duyệt. FE dùng mã này để mời đi làm KYC. */
  KYC_NOT_VERIFIED = 6002,
  KYC_MISSING_DOCUMENTS = 6003,
  KYC_UNSUPPORTED_FILE = 6004,

  /* CAMPAIGN*/
  CAMPAIGN_VERSION_CONFLICT = 7000,
  CAMPAIGN_INVALID_TRANSITION = 7001,
  CAMPAIGN_BRAND_NOT_VERIFIED = 7002,
  CAMPAIGN_CATEGORY_PROHIBITED = 7003,
  CAMPAIGN_CASH_BELOW_FLOOR = 7004,
  /** cash_budget khác creator_count × cash_unit_price khi pricing FIXED. */
  CAMPAIGN_BUDGET_MISMATCH = 7005,
  CAMPAIGN_PRICE_RANGE_INVALID = 7006,
  CAMPAIGN_CHECKLIST_INCOMPLETE = 7007,
  CAMPAIGN_REVIEW_FEEDBACK_EMPTY = 7008,
  /** creator_platforms không bao hết platform của deliverable. */
  CAMPAIGN_PLATFORM_MISMATCH = 7009,
  /** Brand đã chạm trần số campaign chưa kết thúc. */
  CAMPAIGN_LIMIT_REACHED = 7010,
}
