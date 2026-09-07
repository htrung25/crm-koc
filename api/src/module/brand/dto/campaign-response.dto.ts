import { ApiProperty } from '@nestjs/swagger';
import { ECampaignStatus } from '../../../common/enum/campaign.enum';

export class CampaignCreatedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CMP-9KN0CYKR', maxLength: 20 })
  code!: string;

  @ApiProperty({ enum: ECampaignStatus, description: 'Always DRAFT (1)' })
  status!: ECampaignStatus;

  @ApiProperty({
    description: 'Send back on every write to guard against lost updates',
  })
  version!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Latest wizard step, null right after creation',
  })
  wizardStep!: number | null;
}
