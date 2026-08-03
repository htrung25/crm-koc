import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { SocialProviderService } from './provider.service';
import { TikTokService } from './tiktok.service';

describe('SocialProviderService', () => {
  const tikTok = {} as TikTokService;
  const factory = new SocialProviderService(tikTok);

  it('trả đúng instance TikTok', () => {
    expect(factory.getProvider(ESocialPlatform.TIKTOK)).toBe(tikTok);
  });

  it.each([
    ESocialPlatform.YOUTUBE,
    ESocialPlatform.INSTAGRAM,
    ESocialPlatform.FACEBOOK,
  ])('ném lỗi rõ ràng cho %s thay vì trả undefined', (platform) => {
    expect(() => factory.getProvider(platform)).toThrow(
      `SOCIAL_PLATFORM_NOT_IMPLEMENTED: ${platform}`,
    );
  });

  it('mọi giá trị của ESocialPlatform đều được xử lý', () => {
    // Thêm nền tảng mới vào enum mà quên factory sẽ làm test này đỏ
    for (const platform of Object.values(ESocialPlatform)) {
      expect(() => factory.getProvider(platform)).not.toThrow(TypeError);
    }
  });
});
