import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  AUDIT_LOG_ACTIONS,
  EAuditLogCategory,
} from '../../../common/enum/audit-log.enum';
import type { EAuditLogAction } from '../../../common/enum/audit-log.enum';
import { ESortOrder } from '../../../common/enum/sort-fields.enum';

export class AuditLogListItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: EAuditLogCategory, enumName: 'EAuditLogCategory' })
  category: EAuditLogCategory;

  @ApiProperty({ enum: AUDIT_LOG_ACTIONS })
  action: EAuditLogAction;

  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  accountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  emailAttempted: string | null;

  @ApiProperty({ nullable: true, type: String })
  ipAddress: string | null;

  @ApiProperty({ nullable: true, type: String })
  userAgent: string | null;

  @ApiProperty({ nullable: true, type: String })
  resourceType: string | null;

  @ApiProperty({ nullable: true, type: String })
  resourceId: string | null;

  @ApiProperty({ nullable: true, type: Number })
  businessCode: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class AuditLogFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @ApiPropertyOptional({
    description:
      'Search category, action, account ID, attempted email, IP address, resource type or resource ID; case-insensitive',
  })
  search?: string;

  @IsOptional()
  @IsEnum(EAuditLogCategory, {
    message: 'category must be login, audit or approval',
  })
  @ApiPropertyOptional({
    enum: EAuditLogCategory,
    enumName: 'EAuditLogCategory',
  })
  category?: EAuditLogCategory;

  @IsOptional()
  @IsIn(AUDIT_LOG_ACTIONS, {
    message: `action must be one of: ${AUDIT_LOG_ACTIONS.join(', ')}`,
  })
  @ApiPropertyOptional({ enum: AUDIT_LOG_ACTIONS })
  action?: EAuditLogAction;

  @IsOptional()
  @IsUUID('4', { message: 'accountId must be a uuid' })
  @ApiPropertyOptional({ format: 'uuid' })
  accountId?: string;

  /** So khớp CHÍNH XÁC, không ILIKE %...%: giữ index còn dùng được. */
  @IsOptional()
  @IsString()
  @MaxLength(254)
  @ApiPropertyOptional({
    description: 'Exact email typed at a failed login attempt',
  })
  emailAttempted?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @ApiPropertyOptional({ example: 'admin_user' })
  resourceType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @ApiPropertyOptional({ description: 'Requires resourceType to be set too' })
  resourceId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdFrom must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-01-01', format: 'date' })
  createdFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdTo must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
  createdTo?: string;

  @IsOptional()
  @IsEnum(ESortOrder, { message: 'sortOrder must be ASC or DESC' })
  @ApiPropertyOptional({
    enum: ESortOrder,
    enumName: 'ESortOrder',
    default: ESortOrder.DESC,
  })
  sortOrder?: ESortOrder;
}
