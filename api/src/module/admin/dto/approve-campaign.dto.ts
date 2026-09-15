import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { EReviewDecision } from '../../../common/enum/campaign.enum';

export class CampaignApprovalChecklistDto {
  @ApiPropertyOptional({
    description: 'Explicit manual review of a restricted category',
  })
  @IsOptional()
  @IsBoolean()
  restrictedCategoryReviewed?: boolean;
}

export class ApproveCampaignDto {
  @ApiProperty({ enum: [EReviewDecision.APPROVE] })
  @IsIn([EReviewDecision.APPROVE])
  decision!: EReviewDecision.APPROVE;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  expectedCampaignVersion!: number;

  @ApiPropertyOptional({ type: CampaignApprovalChecklistDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CampaignApprovalChecklistDto)
  checklistResult?: CampaignApprovalChecklistDto;
}

export class CampaignApprovedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  submissionId!: string;

  @ApiProperty()
  revisionNumber!: number;

  @ApiProperty({ description: 'APPROVED (5)' })
  status!: number;

  @ApiProperty()
  version!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  approvedAt!: Date;
}
