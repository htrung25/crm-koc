import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ECampaignObjective,
  ECompensationType,
  EPricingModel,
  EUsageRightsKind,
} from '../../../common/enum/campaign.enum';
import { ECreatorContent } from '../../../common/enum/creator-content.enum';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';

export class UpdateCampaignDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  @ApiPropertyOptional({ minimum: 1, maximum: 6, description: 'Bước wizard' })
  wizardStep?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({ maxLength: 150 })
  title?: string | null;

  @IsOptional()
  @IsEnum(ECampaignObjective)
  @ApiPropertyOptional({ enum: ECampaignObjective })
  objective?: ECampaignObjective | null;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ format: 'uuid' })
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  keyMessage?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @ApiPropertyOptional({ type: [String] })
  sellingPoints?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @ApiPropertyOptional({ type: [String] })
  prohibitedContent?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @ApiPropertyOptional({ type: [String] })
  requiredHashtags?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @ApiPropertyOptional({ type: [String] })
  requiredMentions?: string[] | null;

  @IsOptional()
  @IsArray()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  @ArrayMaxSize(20)
  @ApiPropertyOptional({ type: [String], description: 'Bắt buộc HTTPS' })
  requiredLinks?: string[] | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ minimum: 1, maximum: 100 })
  creatorCount?: number | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time' })
  recruitingStartAt?: string | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time' })
  applicationDeadline?: string | null;

  @IsOptional()
  @IsArray()
  @IsEnum(ECreatorContent, { each: true })
  @ApiPropertyOptional({ enum: ECreatorContent, isArray: true })
  creatorContentCategories?: ECreatorContent[];

  @IsOptional()
  @IsArray()
  @IsEnum(ESocialPlatform, { each: true })
  @ApiPropertyOptional({ enum: ESocialPlatform, isArray: true })
  creatorPlatforms?: ESocialPlatform[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0 })
  creatorMinFollowers?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, description: 'Đơn vị %' })
  creatorMinEngagementRate?: number | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(63)
  @ApiPropertyOptional({ type: [String] })
  creatorCities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  creatorAudienceNote?: string | null;

  @IsOptional()
  @IsEnum(ECompensationType)
  @ApiPropertyOptional({ enum: ECompensationType })
  compensationType?: ECompensationType | null;

  @IsOptional()
  @IsEnum(EPricingModel)
  @ApiPropertyOptional({ enum: EPricingModel })
  pricingModel?: EPricingModel | null;

  // Tiền là integer VND. Nhận number cho tiện client, service ép sang string
  // vì cột là bigint.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, description: 'VND, số nguyên' })
  cashUnitPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0 })
  minCashUnitPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0 })
  maxCashUnitPrice?: number | null;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'mô tả, số lượng, giao nhận' })
  productBenefit?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({ maxLength: 2000 })
  usageRightsScope?: string | null;

  @IsOptional()
  @IsEnum(EUsageRightsKind)
  @ApiPropertyOptional({ enum: EUsageRightsKind })
  usageRightsKind?: EUsageRightsKind | null;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time' })
  usageRightsUntil?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @ApiPropertyOptional({ maxLength: 5000 })
  cancellationPolicy?: string | null;
}
