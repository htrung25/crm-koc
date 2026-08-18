import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { GendersEnum } from '../../../common/enum/genders.enum';
import { AccountFilterDto } from './account-filters.dto';

/** Query của GET /admin/creators-list. */
export class CreatorFilterDto extends AccountFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Match against the address in the role profile table',
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

/** Response của GET /admin/creators-list/:id. */
export class CreatorListResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ maxLength: 255 })
  name: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, type: String, example: '+84901111111' })
  phone: string | null;

  @ApiProperty({ enum: ERole, enumName: 'ERole' })
  accountRole: ERole;

  @ApiProperty({ enum: EAccountStatus, enumName: 'EAccountStatus' })
  status: EAccountStatus;

  @ApiProperty({ nullable: true, type: Date, format: 'date-time' })
  emailVerifiedAt: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}
