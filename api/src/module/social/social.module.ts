import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccountEntity } from './entities/social-account.entity';
import { SocialConnectionsService } from './connection.service';
import { SocialConnectionsController } from './connection.controller';
import { SocialProviderService } from './provider.service';
import { SocialTokenService } from './token.service';
import { TikTokService } from './tiktok.service';

/**
 * Mới có TikTok. YouTube, Instagram và Facebook chưa hiện thực —
 * SocialProviderService ném lỗi rõ ràng cho ba nền tảng đó thay vì trả
 * undefined để chỗ gọi nổ ở nơi khác.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SocialAccountEntity])],
  controllers: [SocialConnectionsController],
  providers: [
    SocialConnectionsService,
    SocialProviderService,
    SocialTokenService,
    TikTokService,
  ],
  exports: [SocialConnectionsService, SocialTokenService],
})
export class SocialModule {}
