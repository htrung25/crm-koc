import { AuditLog } from '../entities/audit-log.entity';
import { AuthEntity } from '../../auth/entities/auth.entity';
import { BRAND_DETAIL_COLUMNS, BRAND_LIST_FIELDS, CREATOR_DETAIL_COLUMNS, CREATOR_LIST_FIELDS } from '../constants/user-list.constants';
export type BrandListItem = Pick<AuthEntity, (typeof BRAND_LIST_FIELDS)[number]>;
export type BrandDetail = Pick<AuthEntity, keyof typeof BRAND_DETAIL_COLUMNS>;
export type CreatorListItem = Pick<AuthEntity, (typeof CREATOR_LIST_FIELDS)[number]>;
export type CreatorDetail = Pick<AuthEntity, keyof typeof CREATOR_DETAIL_COLUMNS>;
export type AuditLogListItem = Pick<AuditLog, (typeof import('../constants/audit-log.constants').AUDIT_LOG_LIST_FIELDS)[number]>;
export type AuditLogEvent = Omit<AuditLog, 'createdAt'> & { createdAt: string };
