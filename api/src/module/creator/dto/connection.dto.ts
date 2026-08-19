import { ApiProperty } from '@nestjs/swagger';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';

export class SocialConnectionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ESocialPlatform, enumName: 'ESocialPlatform' })
  platform!: ESocialPlatform;

  @ApiProperty()
  externalAccountId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ nullable: true, type: String })
  biography!: string | null;

  @ApiProperty({ nullable: true, type: String })
  profileUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl!: string | null;

  @ApiProperty({ description: 'bigint nên driver trả về chuỗi' })
  followerCount!: string;

  @ApiProperty()
  followingCount!: string;

  @ApiProperty()
  contentCount!: string;

  @ApiProperty({ type: [String] })
  grantedScopes!: string[];

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  tokenExpiresAt!: Date | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  lastSyncedAt!: Date | null;

  @ApiProperty({ nullable: true, type: String })
  syncError!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}
