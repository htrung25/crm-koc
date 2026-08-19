import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ERole } from '../../../common/enum/roles.enum';
import { EAccountStatus } from '../../../common/enum/account-statuses.enum';
import { AccountFilterDto } from './account-filters.dto';

/** Response của GET /admin/brands-list/:id. */
export class BrandListResponseDto {
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

/** Query của GET /admin/brands-list. */
export class BrandFilterDto extends AccountFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Match against the address in the role profile table',
  })
  address?: string;
}
