import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import {
  NormalizedSocialProfile,
  SocialOAuthTokens,
  SocialProvider,
} from './types/social.types';

/**
 * user.info.profile cần thiết để lấy `username` thật. Thiếu scope này thì
 * TikTok chỉ trả display_name — tên hiển thị, có dấu, đổi lúc nào cũng được,
 * không phải định danh.
 */
const TIKTOK_SCOPES = 'user.info.basic,user.info.profile,user.info.stats';

const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

interface TikTokTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

@Injectable()
export class TikTokService implements SocialProvider {
  private readonly clientKey: string;
  private readonly clientSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.clientKey = this.configService.getOrThrow<string>('TIKTOK_CLIENT_KEY');

    this.clientSecret = this.configService.getOrThrow<string>(
      'TIKTOK_CLIENT_SECRET',
    );
  }

  createAuthorizationUrl(input: {
    state: string;
    redirectUri: string;
  }): string {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      response_type: 'code',
      scope: TIKTOK_SCOPES,
      redirect_uri: input.redirectUri,
      state: input.state,
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  async exchangeAuthorizationCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<SocialOAuthTokens> {
    const payload = await this.postToken(
      new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code: input.code,
        grant_type: 'authorization_code',
        redirect_uri: input.redirectUri,
      }),
      'TIKTOK_TOKEN_EXCHANGE_FAILED',
    );

    return this.toTokens(payload);
  }

  /**
   * Access token của TikTok sống 24 giờ, refresh token sống 365 ngày. Không có
   * bước này thì mọi kết nối tự chết sau một ngày.
   */
  async refreshAccessToken(refreshToken: string): Promise<SocialOAuthTokens> {
    const payload = await this.postToken(
      new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      'TIKTOK_TOKEN_REFRESH_FAILED',
    );

    return this.toTokens(payload);
  }

  async getProfile(accessToken: string): Promise<NormalizedSocialProfile> {
    const fields = [
      'open_id',
      'union_id',
      'username',
      'avatar_url',
      'display_name',
      'bio_description',
      'profile_deep_link',
      'follower_count',
      'following_count',
      'video_count',
    ].join(',');

    const response = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      throw new BadGatewayException('TIKTOK_PROFILE_FETCH_FAILED');
    }

    const payload = (await response.json()) as {
      data?: {
        user?: {
          open_id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string;
          bio_description?: string;
          profile_deep_link?: string;
          follower_count?: number;
          following_count?: number;
          video_count?: number;
        };
      };
    };

    const user = payload.data?.user;

    if (!user?.open_id) {
      throw new BadGatewayException('TIKTOK_PROFILE_INVALID');
    }

    return {
      platform: ESocialPlatform.TIKTOK,
      externalAccountId: user.open_id,
      // open_id làm phương án cuối: username có thể vắng nếu scope bị người
      // dùng từ chối, và cột username là NOT NULL.
      username: user.username ?? user.open_id,
      displayName: user.display_name ?? '',
      biography: user.bio_description ?? null,
      avatarUrl: user.avatar_url ?? null,
      profileUrl: user.profile_deep_link ?? null,
      followerCount: user.follower_count ?? 0,
      followingCount: user.following_count ?? 0,
      contentCount: user.video_count ?? 0,
      rawData: payload as unknown as Record<string, unknown>,
    };
  }

  private async postToken(
    body: URLSearchParams,
    errorCode: string,
  ): Promise<TikTokTokenResponse> {
    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new UnauthorizedException(errorCode);
    }

    return (await response.json()) as TikTokTokenResponse;
  }

  private toTokens(payload: TikTokTokenResponse): SocialOAuthTokens {
    if (!payload.access_token) {
      throw new UnauthorizedException('TIKTOK_ACCESS_TOKEN_MISSING');
    }

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresIn: payload.expires_in,
      scopes: payload.scope?.split(',') ?? [],
    };
  }
}
