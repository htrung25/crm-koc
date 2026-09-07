import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ECampaignContentType } from '../../../common/enum/campaign.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';

export class DeliverableItemDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @IsOptional()
  @IsEnum(ECampaignContentType)
  @ApiPropertyOptional({ enum: ECampaignContentType })
  contentType?: ECampaignContentType | null;

  @IsOptional()
  @IsEnum(ESocialPlatform)
  @ApiPropertyOptional({ enum: ESocialPlatform })
  platform?: ESocialPlatform | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ minimum: 1 })
  quantity?: number | null;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: '{ unit, min, max }' })
  durationOrLength?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  formatRequirements?: string | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time' })
  contentSubmissionDeadline?: string | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time' })
  publishDeadline?: string | null;
}

export class SyncDeliverablesDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description:
      'Campaign version the client holds, to guard against lost updates',
  })
  expectedVersion!: number;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DeliverableItemDto)
  @ApiProperty({ type: [DeliverableItemDto] })
  deliverables!: DeliverableItemDto[];
}
