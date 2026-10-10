import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ProposePriceDto {
  // Không thấp hơn giá campaign: kiểm ở service vì cần đọc campaign.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ minimum: 1, example: 2000000 })
  price: number;
}
