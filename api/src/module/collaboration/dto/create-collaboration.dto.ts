import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateCollaborationDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  creatorId: string;

  // Mọi hợp tác đều thuộc một campaign để tiền trả creator luôn có ký quỹ.
  @IsUUID()
  @ApiProperty({ format: 'uuid' })
  campaignId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({ minimum: 1, example: 1500000 })
  agreedPrice: number;
}
