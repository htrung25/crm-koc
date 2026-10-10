import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateCollaborationDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  creatorId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Bỏ trống nếu thoả thuận trực tiếp, không qua chiến dịch',
  })
  campaignId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ minimum: 1, example: 1500000 })
  agreedPrice: number;
}
