import { ESocialPlatform } from '../../../common/enum/social-platform.enum';

export interface SocialOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes?: string[];
}

export interface NormalizedSocialProfile {
  platform: ESocialPlatform;
  externalAccountId: string;
  username: string;
  displayName: string;
  biography: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;

  followerCount: number;
  followingCount: number;
  contentCount: number;

  /** Payload gốc của nền tảng, lưu nguyên vào raw_data để truy ngược khi số
   * liệu lệch hoặc nền tảng đổi schema. */
  rawData?: Record<string, unknown>;
}

export interface SocialProvider {
  createAuthorizationUrl(input: { state: string; redirectUri: string }): string;

  exchangeAuthorizationCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<SocialOAuthTokens>;

  getProfile(accessToken: string): Promise<NormalizedSocialProfile>;

  refreshAccessToken(refreshToken: string): Promise<SocialOAuthTokens>;
}
export interface OAuthStatePayload {
  creatorProfileId: string;
  platform: ESocialPlatform;
  redirectUri: string;
}

export interface CreateAuthorizationUrlInput {
  creatorProfileId: string;
  platform: ESocialPlatform;
}

export interface HandleCallbackInput {
  platform: ESocialPlatform;
  code: string;
  state: string;
  /** Người đang đăng nhập tại thời điểm callback, để đối chiếu với state. */
  currentAccountId: string;
}

export interface SyncSocialProfileInput {
  creatorProfileId: string;
  platform: ESocialPlatform;
}
