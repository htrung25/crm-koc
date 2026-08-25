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
