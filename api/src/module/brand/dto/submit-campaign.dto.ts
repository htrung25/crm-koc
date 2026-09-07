import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SubmitCampaignDto {
  @ApiProperty({ minimum: 1, description: 'Version the client holds' })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class CampaignSubmittedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Always PENDING_APPROVAL (2)' })
  status!: number;

  @ApiProperty()
  version!: number;

  @ApiProperty({ description: 'Which review round this campaign is on' })
  revisionNumber!: number;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: Date | null;
}
