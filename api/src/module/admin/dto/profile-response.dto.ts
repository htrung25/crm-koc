import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { GendersEnum } from '../../../common/enum/genders.enum';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same value as accounts.id' })
  accountId!: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  name!: string | null;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  address!: string | null;

  @IsOptional()
  @IsEnum(GendersEnum, { message: 'gender must be 1, 2 or 3' })
  @ApiProperty({
    nullable: true,
    type: Number,
    description: '1 = male, 2 = female, 3 = other',
  })
  gender?: GendersEnum;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
