export type AdminRole = "admin" | "super_admin";

/**
 * Phần AdminResponseDto mà FE dùng tới. Backend còn trả phone/status/
 * createdAt… nhưng khai thừa chỉ tạo ràng buộc giả với những field không ai đọc.
 */
export type AdminResponse = {
  id: string;
  name: string;
  email: string;
  adminRole?: AdminRole;
  /** CSV; null hoặc rỗng = KHÔNG giới hạn IP. */
  ipWhitelist: string | null;
};

/** Body lỗi, gộp cả hai hình dạng backend trả về. */
export type WhitelistErrorBody = {
  message: string;
  businessCode?: string;
  clientIp?: string;
};

export const LOCKOUT_CODE = "IP_WHITELIST_WOULD_LOCK_YOU_OUT";
export const SUPER_ADMIN_REQUIRED = "REQUIRES_SUPER_ADMIN";
