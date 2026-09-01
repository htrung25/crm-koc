import { AuditLog } from '../entities/audit-log.entity';

/** Bỏ `metadata`: jsonb không giới hạn kích thước, thuộc về endpoint chi tiết. */
export const AUDIT_LOG_LIST_FIELDS = [
  'id',
  'category',
  'action',
  'accountId',
  'emailAttempted',
  'ipAddress',
  'userAgent',
  'resourceType',
  'resourceId',
  'businessCode',
  'createdAt',
] as const;

/** Kiểu của một dòng trong danh sách: đúng bằng các cột đã select. */
export type AuditLogListItem = Pick<
  AuditLog,
  (typeof AUDIT_LOG_LIST_FIELDS)[number]
>;

export const AUDIT_LOG_SEARCH_EXPRESSION = `(
            "log"."category" || ' ' || "log"."action" || ' ' ||
            coalesce("log"."email_attempted", '') || ' ' ||
            coalesce("log"."ip_address", '') || ' ' ||
            coalesce("log"."resource_type", '') || ' ' ||
            coalesce("log"."resource_id", '')
          )`;

/** pg_trgm cần tối thiểu 3 ký tự; ngắn hơn thì index vô dụng và rơi về seq scan. */
export const AUDIT_LOG_SEARCH_MIN_LENGTH = 3;
