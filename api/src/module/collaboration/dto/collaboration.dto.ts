import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ECollaborationStatus } from '../../../common/enum/collaboration-status.enum';
import { ESortField, ESortOrder } from '../../../common/enum/sort-fields.enum';

/** collaborations không có cột name/email nên không nhận trọn ESortField. */
export const COLLABORATION_SORT_FIELDS = [
  ESortField.CREATED_AT,
  ESortField.UPDATED_AT,
  ESortField.STATUS,
  ESortField.AGREED_PRICE,
  ESortField.COMPLETED_AT,
] as const;

/**
 * Body của POST /brand/collaborations.
 * KHÔNG có brandId: lấy từ token, nhận từ body là tạo hợp tác hộ brand khác.
 */
export class CreateCollaborationDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  creatorId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Bỏ trống nếu thoả thuận trực tiếp, không qua chiến dịch',
  })
  campaignId?: string;

  // numeric(14,2) ở DB. Nhận number rồi để driver tự ép; đọc ra vẫn là chuỗi.
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 1500000 })
  agreedPrice?: number;
}

/**
 * Body của PATCH .../collaborations/:id/status.
 * Trạng thái đích; ai được chuyển sang đâu do service quyết định theo vai trò.
 */
export class UpdateCollaborationStatusDto {
  @IsEnum(ECollaborationStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (submitted), 4 (completed), 5 (cancelled) or 6 (disputed)',
  })
  @ApiProperty({
    enum: ECollaborationStatus,
    enumName: 'ECollaborationStatus',
  })
  status: ECollaborationStatus;
}

/** Một dòng hợp tác trong danh sách. */
export class CollaborationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  brandId: string;

  @ApiProperty({ format: 'uuid' })
  creatorId: string;

  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  campaignId: string | null;

  @ApiProperty({
    enum: ECollaborationStatus,
    enumName: 'ECollaborationStatus',
  })
  status: ECollaborationStatus;

  /** numeric của Postgres về driver pg dưới dạng chuỗi, giữ nguyên để khỏi mất số lẻ. */
  @ApiProperty({ nullable: true, type: String, example: '1500000.00' })
  agreedPrice: string | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  startedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  submittedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  completedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  cancelledAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

/** Query của GET /brand/collaborations. brandId lấy từ token, không nhận ở đây. */
export class CollaborationFilterDto extends PaginationDto {
  @IsOptional()
  // query string luôn là chuỗi: '3' phải thành 3 thì @IsEnum mới pass
  @Type(() => Number)
  @IsEnum(ECollaborationStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (submitted), 4 (completed), 5 (cancelled) or 6 (disputed)',
  })
  @ApiPropertyOptional({
    enum: ECollaborationStatus,
    enumName: 'ECollaborationStatus',
  })
  status?: ECollaborationStatus;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid' })
  creatorId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid' })
  campaignId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdFrom must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-01-01', format: 'date' })
  createdFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdTo must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
  createdTo?: string;

  // query string luôn là chuỗi: '500000' phải thành số thì @IsNumber mới pass
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 500000 })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 5000000 })
  maxPrice?: number;

  @IsOptional()
  @IsIn(COLLABORATION_SORT_FIELDS as readonly string[], {
    message: `sortBy must be one of: ${COLLABORATION_SORT_FIELDS.join(', ')}`,
  })
  @ApiPropertyOptional({
    enum: COLLABORATION_SORT_FIELDS,
    default: ESortField.CREATED_AT,
  })
  sortBy?: (typeof COLLABORATION_SORT_FIELDS)[number];

  @IsOptional()
  @IsEnum(ESortOrder, { message: 'sortOrder must be ASC or DESC' })
  @ApiPropertyOptional({
    enum: ESortOrder,
    enumName: 'ESortOrder',
    default: ESortOrder.DESC,
  })
  sortOrder?: ESortOrder;
}
