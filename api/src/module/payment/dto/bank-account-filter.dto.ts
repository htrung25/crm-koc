import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_LIMIT } from '../../../common/dto/pagination.dto';
import { ESortOrder } from '../../../common/enum/sort-fields.enum';

export enum EBankAccountSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  BANK_CODE = 'bankCode',
  BANK_NAME = 'bankName',
  IS_DEFAULT = 'isDefault',
}

const present = (_object: unknown, value: unknown) => value !== undefined;
const integerQuery = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
const trimQuery = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class BankAccountFilterDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @ValidateIf(present)
  @Transform(integerQuery)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_LIMIT, default: 20 })
  @ValidateIf(present)
  @Transform(integerQuery)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number;

  @ApiPropertyOptional({ maxLength: 32 })
  @ValidateIf(present)
  @Transform(trimQuery)
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  bankCode?: string;

  @ApiPropertyOptional({ maxLength: 34 })
  @ValidateIf(present)
  @Transform(trimQuery)
  @IsString()
  @MinLength(1)
  @MaxLength(34)
  bankNumber?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @ValidateIf(present)
  @Transform(trimQuery)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  bankName?: string;

  @ApiPropertyOptional({ type: Boolean })
  @ValidateIf(present)
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    enum: EBankAccountSortField,
    default: EBankAccountSortField.CREATED_AT,
  })
  @ValidateIf(present)
  @IsEnum(EBankAccountSortField)
  sortBy?: EBankAccountSortField;

  @ApiPropertyOptional({ enum: ESortOrder, default: ESortOrder.DESC })
  @ValidateIf(present)
  @IsEnum(ESortOrder)
  sortOrder?: ESortOrder;
}
