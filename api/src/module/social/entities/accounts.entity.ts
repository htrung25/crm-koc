import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('social_accounts')
@Index(
  'uq_social_accounts_platform_external_id',
  ['platform', 'externalAccountId'],
  { unique: true },
)
@Index(
  'uq_social_accounts_creator_platform',
  ['creatorProfileId', 'platform'],
  { unique: true },
)
export class SocialAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'creator_profile_id', type: 'uuid' })
  creatorProfileId: string;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
    enumName: 'social_platform',
  })
  platform: ESocialPlatform;

  @Column({ name: 'external_account_id', type: 'varchar', length: 255 })
  externalAccountId: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName: string;

  @Column({ name: 'profile_url', type: 'text', nullable: true })
  profileUrl: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: string;

  @Column({ name: 'following_count', type: 'bigint', default: 0 })
  followingCount: string;

  @Column({ name: 'content_count', type: 'bigint', default: 0 })
  contentCount: string;

  @Column({
    name: 'engagement_rate',
    type: 'numeric',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  engagementRate: string | null;

  @Column({ name: 'access_token_encrypted', type: 'text', nullable: true })
  accessTokenEncrypted: string | null;

  @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
  refreshTokenEncrypted: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt: Date | null;

  @Column({ name: 'granted_scopes', type: 'text', array: true, default: '{}' })
  grantedScopes: string[];

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}