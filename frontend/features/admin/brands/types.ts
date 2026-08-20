/** Khớp EAccountStatus của backend — là SỐ, không phải chuỗi. */
export const ACCOUNT_STATUS = {
  PENDING: 1,
  ACTIVE: 2,
  SUSPENDED: 3,
  BANNED: 4,
} as const;

export type AccountStatus =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export const STATUS_CODES = [1, 2, 3, 4] as const;

/** Khớp ESortField; chỉ mở những trường danh sách này thật sự dùng. */
export const SORT_FIELDS = ["createdAt", "name", "email", "status"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = "ASC" | "DESC";

/**
 * Một dòng trong GET /admin/brands-list.
 *
 * Năm field cuối KHÔNG có trong AccountFilterItemDto hiện tại nhưng đều có
 * nguồn thật trong DB: industry/logoUrl ở brand_profiles, ba chỉ số còn lại
 * suy ra từ bảng collaborations (campaign_id, creator_id, agreed_price).
 * Khai optional để giao diện dựng sẵn chỗ, và tự hiện lên đúng lúc backend
 * bổ sung — thay vì điền số giả rồi người xem tưởng là thật.
 */
export type BrandRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  accountRole: string;
  status: AccountStatus;
  createdAt: string;
  industry?: string | null;
  logoUrl?: string | null;
  campaignCount?: number;
  kocCount?: number;
  budget?: number;
};

/** Bọc phân trang dùng chung cho mọi danh sách của backend. */
export type BrandPage = {
  data: BrandRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type BrandQuery = {
  page: number;
  limit: number;
  search: string;
  status: AccountStatus | "";
  sortBy: SortField;
  sortOrder: SortOrder;
};

export const DEFAULT_QUERY: BrandQuery = {
  page: 1,
  limit: 10,
  search: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "DESC",
};
