import { ApiProperty } from '@nestjs/swagger';
import { CreatorProfile } from '../entities/creator-profile.entity';

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

  @ApiProperty({ type: [String], example: ['beauty', 'fashion'] })
  contentCategories!: string[];

  @ApiProperty({ nullable: true, type: String })
  portfolioUrl!: string | null;

  @ApiProperty({ example: 'Asia/Ho_Chi_Minh' })
  timezone!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  static from(entity: CreatorProfile): CreatorProfileResponseDto {
    return {
      accountId: entity.accountId,
      displayName: entity.displayName,
      email: entity.email,
      phone: entity.phone,
      bio: entity.bio,
      avatarUrl: entity.avatarUrl,
      dateOfBirth: entity.dateOfBirth,
      gender: entity.gender,
      city: entity.city,
      address: entity.address,
      contentCategories: entity.contentCategories,
      portfolioUrl: entity.portfolioUrl,
      timezone: entity.timezone,
      updatedAt: entity.updatedAt,
    };
  }
}
