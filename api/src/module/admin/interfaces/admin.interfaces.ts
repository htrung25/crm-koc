import { AuthEntity } from '../../auth/entities/auth.entity';
import { EAdminRole } from '../constants/admin-roles.enum';

export interface WriteAuditLogDto {
  category: import('../../../common/enum/audit-log.enum').EAuditLogCategory;
  action: import('../../../common/enum/audit-log.enum').EAuditLogAction;
  accountId?: string | null;
  emailAttempted?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  businessCode?:
    import('../../../common/enum/business-code.enum').EBusinessCode | null;
  metadata?: Record<string, unknown> | null;
}

export type AdminListRow = AuthEntity & {
  ipWhitelist: string | null;
  adminRole: EAdminRole;
};
