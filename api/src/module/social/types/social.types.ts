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

/**
 * Hợp đồng mà mọi nền tảng phải hiện thực.
 *
 * KHÔNG phải là SocialProviderService — cái đó là factory chọn provider. Trộn
 * hai thứ làm một sẽ bắt mỗi provider phải có getProvider(), điều vô nghĩa.
 */
export interface SocialProvider {
  createAuthorizationUrl(input: { state: string; redirectUri: string }): string;

  exchangeAuthorizationCode(input: {
    code: string;
    redirectUri: string;
  }): Promise<SocialOAuthTokens>;

  getProfile(accessToken: string): Promise<NormalizedSocialProfile>;

  /**
   * KHÔNG optional: access token của mọi nền tảng đều hết hạn (TikTok 24 giờ),
   * nên thiếu bước này là kết nối tự chết sau một ngày. Nền tảng nào không hỗ
   * trợ refresh thì hiện thực ném lỗi tường minh, đừng bỏ trống.
   */
  refreshAccessToken(refreshToken: string): Promise<SocialOAuthTokens>;
}

/**
 * Nội dung state của luồng OAuth, lưu Ở PHÍA SERVER trong Redis.
 *
 * Chuỗi `state` gửi ra ngoài chỉ là khoá tra cứu ngẫu nhiên, không mang dữ
 * liệu. Nhờ vậy client không sửa được creatorProfileId hay redirectUri —
 * chống OAuth login CSRF: kẻ tấn công có ép nạn nhân mở callback với code của
 * mình thì tài khoản social đó cũng chỉ gắn vào chính hồ sơ của kẻ tấn công.
 */
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
