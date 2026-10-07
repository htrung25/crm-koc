import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ESortField, ESortOrder } from '../../../common/enum/sort-fields.enum';
import { WITHDRAWAL_SORT_FIELDS } from '../constants/payment.constants';
import type { WithdrawalSortField } from '../types/payment.types';

export class WithdrawalFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: WITHDRAWAL_SORT_FIELDS,
    default: ESortField.CREATED_AT,
  })
  @IsOptional()
  @IsIn(WITHDRAWAL_SORT_FIELDS)
  sortBy?: WithdrawalSortField;

  @ApiPropertyOptional({ enum: ESortOrder, default: ESortOrder.DESC })
  @IsOptional()
  @IsEnum(ESortOrder)
  sortOrder?: ESortOrder;
}
