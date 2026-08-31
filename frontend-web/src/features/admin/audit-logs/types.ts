export const AUDIT_LOG_CATEGORIES = ["login", "audit", "approval"] as const;
export type AuditLogCategory = (typeof AUDIT_LOG_CATEGORIES)[number];

export const LOGIN_ACTIONS = [
  "fail_credentials",
  "fail_ip",
  "fail_otp",
  "fail_locked",
  "fail_device",
  "otp_sent",
  "logout",
] as const;

export const AUDIT_ACTIONS = ["create", "update", "delete"] as const;

export const APPROVAL_ACTIONS = ["approve", "reject"] as const;

export const AUDIT_LOG_ACTIONS = [
  ...LOGIN_ACTIONS,
  ...AUDIT_ACTIONS,
  ...APPROVAL_ACTIONS,
] as const;

export type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[number];

export type SortOrder = "ASC" | "DESC";

export type AuditLogRow = {
  id: string;
  category: AuditLogCategory;
  action: AuditLogAction;
  accountId: string | null;
  emailAttempted: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  businessCode: number | null;
  createdAt: string;
};

export type AuditLogPage = {
  data: AuditLogRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuditLogQuery = {
  page: number;
  limit: number;
  search: string;
  category: AuditLogCategory | "";
  action: AuditLogAction | "";
  createdFrom?: string;
  createdTo?: string;
  sortOrder: SortOrder;
};

export const DEFAULT_AUDIT_LOG_QUERY: AuditLogQuery = {
  page: 1,
  limit: 10,
  search: "",
  category: "",
  action: "",
  sortOrder: "DESC",
};
