import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { GendersEnum } from '../../../common/enum/genders.enum';
import { AccountFilterDto } from './account-filters.dto';

export class CreatorFilterDto extends AccountFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Match against the address in account_profiles',
  })
  address?: string;

  // gender là smallint => query string '1' phải ép về number trước khi @IsEnum
  @IsOptional()
  @Type(() => Number)
  @IsEnum(GendersEnum, { message: 'gender must be 1, 2 or 3' })
  @ApiPropertyOptional({
    enum: GendersEnum,
    enumName: 'GendersEnum',
    description: '1 = male, 2 = female, 3 = other',
  })
  gender?: GendersEnum;
}
