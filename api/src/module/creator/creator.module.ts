import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { CreatorProfileService } from './creator-profile.service';
import { CreatorProfileController } from './creator-profile.controller';
import { SecurityModule } from '../../security/security.module';
import { SocialAccount } from './entities/social-account.entity';
import { SocialConnectionsController } from './connection.controller';
import { SocialConnectionsService } from './connection.service';
import { SocialProviderService } from './social-provider.service';
import { SocialTokenService } from './social-token.service';
import { TikTokService } from './tiktok.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreatorProfile, AuthEntity, SocialAccount]),
    SecurityModule,
  ],
  controllers: [CreatorProfileController, SocialConnectionsController],
  providers: [
    CreatorProfileService,
    SocialConnectionsService,
    SocialProviderService,
    SocialTokenService,
    TikTokService,
  ],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [
    CreatorProfileService,
    SocialConnectionsService,
    SocialTokenService,
  ],
})
export class CreatorModule {}
