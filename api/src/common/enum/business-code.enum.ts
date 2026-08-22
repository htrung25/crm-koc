/* Dải số, chừa chỗ mở rộng theo miền:
 *   0            thành công
 *   -1           lỗi không phân loại được
 *   1000-1999    auth (token, OTP, phiên)
 *   2000-2999    admin / ip whitelist
 *   3000-3999    collaboration
 *   4000-4999    creator / social
 *   5000-5999    hệ thống / vận hành
 */
export enum EBusinessCode {
  SUCCESS = 0,
  UNKNOWN_ERROR = -1,

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
}
