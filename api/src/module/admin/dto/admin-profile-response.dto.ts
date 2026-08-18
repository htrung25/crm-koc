import { ApiProperty } from '@nestjs/swagger';

export class AdminProfileResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same value as accounts.id' })
  accountId: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  name: string | null;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl: string | null;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
