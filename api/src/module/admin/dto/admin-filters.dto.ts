import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EAccountSortField } from '../../../common/enum/sort-fields.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { ESortOrder } from '../../../common/enum/sort-fields.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

/** Query string của GET /admin. page/limit kế thừa từ PaginationDto. */
export class AdminFilters extends PaginationDto {
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
  @ApiPropertyOptional({
    enum: EAccountStatus,
    enumName: 'EAccountStatus',
    description: 'Filter by account status',
  })
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
}
