import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ESortField, ESortOrder } from '../../../common/enum/sort-fields.enum';
import { BANK_ACCOUNT_SORT_FIELDS } from '../constants/payment.constants';
import type { BankAccountSortField } from '../types/payment.types';

export class BankAccountFilterDto extends PaginationDto {
  @ApiPropertyOptional({ maxLength: 32 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  bankCode?: string;

  @ApiPropertyOptional({ maxLength: 34 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(34)
  bankNumber?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  bankName?: string;

  // Transform vì query string luôn là 'true'/'false' dạng chuỗi
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    enum: BANK_ACCOUNT_SORT_FIELDS,
    default: ESortField.CREATED_AT,
  })
  @IsOptional()
  @IsIn(BANK_ACCOUNT_SORT_FIELDS)
  sortBy?: BankAccountSortField;

  @ApiPropertyOptional({ enum: ESortOrder, default: ESortOrder.DESC })
  @IsOptional()
  @IsEnum(ESortOrder)
  sortOrder?: ESortOrder;
}
