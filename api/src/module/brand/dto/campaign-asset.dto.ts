import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ECampaignAssetKind } from '../../../common/enum/campaign.enum';

export class CampaignAssetVersionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483646)
  @ApiProperty({ minimum: 1 })
  expectedVersion: number;
}

export class UploadCampaignAssetDto extends CampaignAssetVersionDto {
  @IsEnum(ECampaignAssetKind)
  @ApiProperty({ enum: ECampaignAssetKind })
  kind: ECampaignAssetKind;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Replace an existing asset of the same kind, retaining its position and id',
  })
  replaceAssetId?: string;
}

export class ReorderCampaignAssetsDto extends CampaignAssetVersionDto {
  @IsEnum(ECampaignAssetKind)
  @ApiProperty({ enum: ECampaignAssetKind })
  kind: ECampaignAssetKind;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(32767)
  @IsUUID('all', { each: true })
  @ApiProperty({
    type: [String],
    description:
      'Complete list of current asset ids for this kind, in display order',
  })
  assetIds: string[];
}

export class CampaignAssetRevisionQueryDto {
  @IsEnum(ECampaignAssetKind)
  @ApiProperty({ enum: ECampaignAssetKind })
  kind: ECampaignAssetKind;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(32767)
  @ApiProperty({ minimum: 1 })
  position: number;
}

export class CampaignAssetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
  @ApiProperty({ enum: ECampaignAssetKind })
  kind: ECampaignAssetKind;
  @ApiProperty()
  position: number;
  @ApiProperty({ type: String, nullable: true })
  originalName: string | null;
  @ApiProperty()
  mimeType: string;
  @ApiProperty()
  sizeBytes: number;
}

export class CampaignAssetsResponseDto {
  @ApiProperty()
  version: number;
  @ApiProperty({ type: [CampaignAssetResponseDto] })
  assets: CampaignAssetResponseDto[];
}

export class CampaignAssetUploadedResponseDto {
  @ApiProperty()
  version: number;
  @ApiProperty({ type: CampaignAssetResponseDto })
  asset: CampaignAssetResponseDto;
}

export class CampaignAssetDeletedResponseDto {
  @ApiProperty()
  version: number;
}
