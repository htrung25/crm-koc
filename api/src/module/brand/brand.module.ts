import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';
import { SecurityModule } from '../../security/security.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignSubmitService } from './campaign-submit.service';
import { CampaignTransitionService } from './campaign-transition.service';
import { Campaign } from './entities/campaign.entity';
import { CampaignAsset } from './entities/campaign-asset.entity';
import { CampaignCategory } from './entities/campaign-category.entity';
import { CampaignDeliverable } from './entities/campaign-deliverable.entity';
import { CampaignReviewSubmission } from './entities/campaign-review-submission.entity';
import { CampaignStatusHistory } from './entities/campaign-status-history.entity';
import { KycModule } from '../kyc/kyc.module';
import { SystemConfigurationModule } from '../system-configuration/system-configuration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandProfile,
      AuthEntity,
      Campaign,
      CampaignCategory,
      CampaignDeliverable,
      CampaignAsset,
      CampaignStatusHistory,
      CampaignReviewSubmission,
    ]),
    SecurityModule,
    // Gửi duyệt campaign đòi KYC đã VERIFIED và giá sàn từ system config.
    KycModule,
    SystemConfigurationModule,
  ],
  controllers: [BrandProfileController, CampaignController],

  providers: [
    BrandProfileService,
    CampaignService,
    CampaignTransitionService,
    CampaignSubmitService,
  ],

  exports: [BrandProfileService, CampaignService],
})
export class BrandModule {}
