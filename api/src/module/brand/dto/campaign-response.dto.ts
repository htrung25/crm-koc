import { ApiProperty } from '@nestjs/swagger';
import { ECampaignStatus } from '../../../common/enum/campaign.enum';

export class CampaignCreatedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CMP-9KN0CYKR', maxLength: 20 })
  code!: string;

  @ApiProperty({ enum: ECampaignStatus, description: 'Luôn là DRAFT (1)' })
  status!: ECampaignStatus;

  @ApiProperty({ description: 'Gửi lại ở mọi lệnh sửa để chống ghi đè' })
  version!: number;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Bước wizard gần nhất, null khi vừa tạo',
  })
  wizardStep!: number | null;
}
