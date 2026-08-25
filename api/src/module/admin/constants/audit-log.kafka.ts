import {
  EAuditLogAction,
  EAuditLogCategory,
} from 'src/common/enum/audit-log.enum';

export const ADMIN_LOG_TOPIC = 'audit-log-events';
export const ADMIN_LOG_CONSUMER_GROUP = 'crm-koc-admin-log';

export interface AdminLogEvent {
  category: EAuditLogCategory;
  action: EAuditLogAction;
  adminUserId?: string;
  emailAttempted?: string;
  ipAddress?: string;
  userAgent?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}
