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

/**
 * KHÔNG phải businessCode do backend trả. SuperAdminGuard ném
 * ForbiddenException thô ('REQUIRES_SUPER_ADMIN' chỉ nằm ở field `message`
 * của Nest, không có `businessCode`). Đây là mã do Route Handler
 * (app/api/admin/me/ip-whitelist/route.ts, hàm toErrorResponse) tự gắn vào
 * sau khi chuẩn hoá lỗi 403 đó — để lớp UI chỉ cần biết một hình dạng lỗi.
 */
export const SUPER_ADMIN_REQUIRED = "REQUIRES_SUPER_ADMIN";
