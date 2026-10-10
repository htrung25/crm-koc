import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
import {
  COLLABORATION_SORT_FIELDS,
  COLLABORATION_STATUS_MESSAGE,
  toNumberQuery,
} from '../constants/collaboration.constants';
import type { CollaborationSortField } from '../types/collaboration.types';

export class CollaborationFilterDto extends PaginationDto {
  @IsOptional()
  // query string luôn là chuỗi: '3' phải thành 3 thì @IsEnum mới pass
  @Type(() => Number)
  @IsEnum(ECollaborationStatus, { message: COLLABORATION_STATUS_MESSAGE })
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
  @IsDateString(
    { strict: true },
    { message: 'createdFrom must be an ISO date string' },
  )
  @ApiPropertyOptional({ example: '2026-01-01', format: 'date' })
  createdFrom?: string;

  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'createdTo must be an ISO date string' },
  )
  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
  createdTo?: string;

  @IsOptional()
  @Transform(toNumberQuery)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, example: 500000 })
  minPrice?: number;

  @IsOptional()
  @Transform(toNumberQuery)
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
  sortBy?: CollaborationSortField;

  @IsOptional()
  @IsEnum(ESortOrder, { message: 'sortOrder must be ASC or DESC' })
  @ApiPropertyOptional({
    enum: ESortOrder,
    enumName: 'ESortOrder',
    default: ESortOrder.DESC,
  })
  sortOrder?: ESortOrder;
}
