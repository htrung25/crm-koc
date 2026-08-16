import { ApiProperty } from '@nestjs/swagger';
import { ECreatorContent } from '../../../common/enum/creator-content.enum';

export class CreatorProfileResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Same value as accounts.id' })
  accountId!: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 255 })
  displayName!: string | null;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ nullable: true, type: String, maxLength: 20 })
  phone!: string | null;

  @ApiProperty({ nullable: true, type: String })
  bio!: string | null;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl!: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date' })
  dateOfBirth!: string | null;

  @ApiProperty({
    nullable: true,
    type: Number,
    description: '1 = male, 2 = female, 3 = other',
  })
  gender!: number | null;

  @ApiProperty({ nullable: true, type: String, maxLength: 128 })
  city!: string | null;

  @ApiProperty({ nullable: true, type: String })
  address!: string | null;

  @ApiProperty({
    enum: ECreatorContent,
    enumName: 'ECreatorContent',
    isArray: true,
    example: [ECreatorContent.BEAUTY, ECreatorContent.FASHION],
  })
  contentCategories!: ECreatorContent[];

  @ApiProperty({ nullable: true, type: String })
  portfolioUrl!: string | null;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
