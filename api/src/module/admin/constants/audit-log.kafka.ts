import type { AuditLog } from '../entities/audit-log.entity';

export const AUDIT_LOG_TOPIC = 'audit-log-events';

export type AuditLogEvent = Omit<AuditLog, 'createdAt'> & {
  /** ISO 8601: Date không sống sót qua JSON.stringify hai đầu. */
  createdAt: string;
};
