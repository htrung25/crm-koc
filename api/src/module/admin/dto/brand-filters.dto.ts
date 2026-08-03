import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AccountFilterDto } from './account-filters.dto';

export class BrandFilterDto extends AccountFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Match against the address in the role profile table',
  })
  address?: string;
}
