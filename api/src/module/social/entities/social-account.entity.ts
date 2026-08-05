import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ESocialPlatform } from '../../../common/enum/social-platform.enum';
import { CreatorProfile } from '../../creator/entities/creator-profile.entity';

@Entity('social_accounts')
@Index(
  'uq_social_accounts_platform_external_id',
  ['platform', 'externalAccountId'],
  { unique: true },
)
@Index(
  'uq_social_accounts_creator_platform',
  ['creatorProfileId', 'platform'],
  {
    unique: true,
  },
)
export class SocialAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'creator_profile_id', type: 'uuid' })
  creatorProfileId!: string;

  @ManyToOne(() => CreatorProfile, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'creator_profile_id' })
  creatorProfile?: CreatorProfile;

  // varchar + CHECK ở migration, KHÔNG dùng enum type của Postgres: thêm nền
  // tảng mới chỉ cần sửa CHECK, còn ALTER TYPE ... ADD VALUE thì nhãn vừa thêm
  // chưa dùng được trong cùng transaction, mà TypeORM bọc mỗi migration trong
  // một transaction. Và enum type không bao giờ xoá được nhãn.
  @Column({ type: 'varchar', length: 32 })
  platform!: ESocialPlatform;

  @Column({ name: 'external_account_id', type: 'varchar', length: 255 })
  externalAccountId!: string;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  biography!: string | null;

  @Column({ name: 'profile_url', type: 'text', nullable: true })
  profileUrl!: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl!: string | null;

  // bigint => driver trả về string, không phải number. Khai string là đúng.
  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount!: string;

  @Column({ name: 'following_count', type: 'bigint', default: 0 })
  followingCount!: string;

  @Column({ name: 'content_count', type: 'bigint', default: 0 })
  contentCount!: string;

  @Column({
    name: 'engagement_rate',
    type: 'numeric',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  engagementRate!: string | null;

  @Column({ name: 'access_token_encrypted', type: 'text', nullable: true })
  accessTokenEncrypted!: string | null;

  @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
  refreshTokenEncrypted!: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ name: 'granted_scopes', type: 'text', array: true, default: '{}' })
  grantedScopes!: string[];

  /** Payload gốc của nền tảng, để truy ngược khi số liệu lệch hoặc API đổi. */
  @Column({ name: 'raw_data', type: 'jsonb', nullable: true })
  rawData!: Record<string, unknown> | null;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt!: Date | null;

  @Column({ name: 'sync_error', type: 'text', nullable: true })
  syncError!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
