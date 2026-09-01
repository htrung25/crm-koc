/**
 * Phản chiếu EBusinessCode của backend (api/src/common/enum/business-code.enum.ts).
 * Backend trả về SỐ, không phải chuỗi. Thêm mã mới ở đây thì kiểm lại bên đó.
 *
 * Dải: 1000-1999 auth ·
 * 2000-2999 admin · 
 * 5000-5999 hệ thống · 
 * 6000+ kyc
 */
export const BUSINESS_CODE = {
  UNKNOWN_ERROR: -1,
  /** X-Device-Id không khớp thiết bị đã đăng nhập, hoặc thiếu hẳn header. */
  DEVICE_MISMATCH: 1000,
  IP_WHITELIST_WOULD_LOCK_YOU_OUT: 2002,
  SYSTEM_UNDER_MAINTENANCE: 5000,
} as const;
