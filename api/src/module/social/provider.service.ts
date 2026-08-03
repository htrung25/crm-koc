import { BadRequestException, Injectable } from '@nestjs/common';
import { ESocialPlatform } from '../../common/enum/social-platform.enum';
import { SocialProvider } from './types/social.types';
import { TikTokService } from './tiktok.service';

/**
 * Chọn provider theo nền tảng. Đây là FACTORY — nó không phải là provider, nên
 * các service nền tảng implements SocialProvider chứ không implements class này.
 */
@Injectable()
export class SocialProviderService {
  constructor(private readonly tikTokService: TikTokService) {}

  getProvider(platform: ESocialPlatform): SocialProvider {
    switch (platform) {
      case ESocialPlatform.TIKTOK:
        return this.tikTokService;

      // YouTube, Instagram, Facebook chưa hiện thực. Ném lỗi rõ ràng thay vì
      // trả undefined để chỗ gọi nổ ở nơi khác.
      case ESocialPlatform.YOUTUBE:
      case ESocialPlatform.INSTAGRAM:
      case ESocialPlatform.FACEBOOK:
        throw new BadRequestException(
          `SOCIAL_PLATFORM_NOT_IMPLEMENTED: ${platform}`,
        );
    }
  }
}
