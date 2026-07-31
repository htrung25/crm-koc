import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import {
  EAccountSortField,
  ESortOrder,
} from '../../../common/enum/sort-fields.enum';

export class AccountFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Search by name or email, case-insensitive',
  })
  search?: string;

  @IsOptional()
  // query string luôn là chuỗi: '2' phải thành 2 thì @IsEnum mới pass
  @Type(() => Number)
  @IsEnum(EAccountStatus, {
    message:
      'status must be 1 (pending), 2 (active), 3 (suspended) or 4 (banned)',
  })
  @ApiPropertyOptional({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status?: EAccountStatus;

  @IsOptional()
  @IsEnum(EAccountSortField, {
    message: 'sortBy must be createdAt, updatedAt, name, email or status',
  })
  @ApiPropertyOptional({
    enum: EAccountSortField,
    enumName: 'EAccountSortField',
    default: EAccountSortField.CREATED_AT,
  })
  sortBy?: EAccountSortField;

  @IsOptional()
  @IsEnum(ESortOrder, { message: 'sortOrder must be ASC or DESC' })
  @ApiPropertyOptional({
    enum: ESortOrder,
    enumName: 'ESortOrder',
    default: ESortOrder.DESC,
  })
  sortOrder?: ESortOrder;

  // Transform vì query string luôn là 'true'/'false' dạng chuỗi
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description: 'true = email đã xác minh, false = chưa',
  })
  emailVerified?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'createdFrom must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-01-01', format: 'date' })
  createdFrom?: string;

  @IsOptional()
  @IsDateString({}, { message: 'createdTo must be an ISO date string' })
  @ApiPropertyOptional({ example: '2026-12-31', format: 'date' })
  createdTo?: string;
}
