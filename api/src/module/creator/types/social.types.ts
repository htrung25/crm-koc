import { SocialAccount } from '../entities/social-account.entity';

export type SocialConnection = Pick<
  SocialAccount,
  | 'id'
  | 'platform'
  | 'externalAccountId'
  | 'username'
  | 'displayName'
  | 'biography'
  | 'profileUrl'
  | 'avatarUrl'
  | 'followerCount'
  | 'followingCount'
  | 'contentCount'
  | 'grantedScopes'
  | 'tokenExpiresAt'
  | 'lastSyncedAt'
  | 'syncError'
  | 'isActive'
  | 'createdAt'
>;
