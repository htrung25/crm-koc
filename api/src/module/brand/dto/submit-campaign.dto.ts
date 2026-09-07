import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SubmitCampaignDto {
  @ApiProperty({ minimum: 1, description: 'Version client đang giữ' })
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class CampaignSubmittedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Luôn là PENDING_APPROVAL (2)' })
  status!: number;

  @ApiProperty()
  version!: number;

  @ApiProperty({ description: 'Lượt gửi duyệt thứ mấy của campaign này' })
  revisionNumber!: number;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  submittedAt!: Date | null;
}
