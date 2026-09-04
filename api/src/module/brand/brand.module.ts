import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';
import { SecurityModule } from '../../security/security.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { Campaign } from './entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandProfile, AuthEntity, Campaign]),
    SecurityModule,
  ],
  controllers: [BrandProfileController, CampaignController],
  providers: [BrandProfileService, CampaignService],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [BrandProfileService],
})
export class BrandModule {}
