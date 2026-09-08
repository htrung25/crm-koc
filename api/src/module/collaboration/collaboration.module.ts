import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '../../security/security.module';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandModule } from '../brand/brand.module';
import { CreatorModule } from '../creator/creator.module';
import { Campaign } from '../brand/entities/campaign.entity';
import { SocialAccount } from '../creator/entities/social-account.entity';
import { SystemConfigurationModule } from '../system-configuration/system-configuration.module';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationService } from './collaboration.service';
import { BrandCollaborationController } from './brand-collaboration.controller';
import { CreatorCollaborationController } from './creator-collaboration.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Collaboration,
      AuthEntity,
      Campaign,
      SocialAccount,
    ]),
    SecurityModule,
    BrandModule,
    CreatorModule,
    SystemConfigurationModule,
  ],
  controllers: [BrandCollaborationController, CreatorCollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
