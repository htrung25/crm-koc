import type { AuditLog } from '../entities/audit-log.entity';

export const ADMIN_LOG_TOPIC = 'audit-log-events';

export type AdminLogEvent = Omit<AuditLog, 'createdAt'> & {
  /** ISO 8601: Date không sống sót qua JSON.stringify hai đầu. */
  createdAt: string;
};
