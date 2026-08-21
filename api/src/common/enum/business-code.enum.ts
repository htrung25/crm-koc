/* Dải số, chừa chỗ mở rộng theo miền:
 *   0            thành công
 *   -1           lỗi không phân loại được
 *   1000-1999    auth (token, OTP, phiên)
 *   2000-2999    admin / ip whitelist
 *   3000-3999    collaboration
 *   4000-4999    creator / social
 */
export enum EBusinessCode {
  SUCCESS = 0,
  UNKNOWN_ERROR = -1,

  INVALID_IP_FORMAT = 2000,
  INVALID_CIDR_FORMAT = 2001,
  IP_WHITELIST_WOULD_LOCK_YOU_OUT = 2002,
}
