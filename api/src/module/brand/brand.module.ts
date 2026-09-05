import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';
import { SecurityModule } from '../../security/security.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignTransitionService } from './campaign-transition.service';
import { Campaign } from './entities/campaign.entity';
import { CampaignStatusHistory } from './entities/campaign-status-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandProfile,
      AuthEntity,
      Campaign,
      CampaignStatusHistory,
    ]),
    SecurityModule,
  ],
  controllers: [BrandProfileController, CampaignController],
  providers: [BrandProfileService, CampaignService, CampaignTransitionService],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [BrandProfileService],
})
export class BrandModule {}
