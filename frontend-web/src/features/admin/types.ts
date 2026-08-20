/** Khớp EAccountStatus của backend — là SỐ, không phải chuỗi. */
export const ACCOUNT_STATUS = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  BANNED: 4,
} as const;

export type AccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

/**
 * Thứ tự hiển thị trong bộ lọc và ô chọn trạng thái. Cả danh sách brand lẫn
 * màn hình IP whitelist đều dùng, nên nó nằm ở cấp admin chứ không thuộc về
 * riêng feature nào — feature này import type nội bộ của feature kia là mở
 * đường cho phụ thuộc vòng.
 */
export const STATUS_CODES = [1, 2, 3, 4] as const;
