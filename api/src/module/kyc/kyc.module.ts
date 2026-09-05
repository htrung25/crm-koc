import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '../../security/security.module';
import { KycDocument } from './entities/kyc-document.entity';
import { KycDocumentView } from './entities/kyc-document-view.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycAdminController } from './kyc-admin.controller';
import { SuperAdminGuard } from '../admin/super-admin.guard';
import { AdminUser } from '../admin/entities/admin-user.entity';
import { AuthEntity } from '../auth/entities/auth.entity';
import { IpWhitelistModule } from '../admin/ip-whitelist.module';
import { QueueModule } from '../../queue/queue.module';

/**
 * KYC phục vụ cả brand, creator lẫn admin nên đứng cùng cấp với các module vai
 * trò, không nằm trong module nào — giống CollaborationModule.
 *
 * StorageService lấy qua SecurityModule chứ KHÔNG khai lại ở đây: khai lại là
 * có instance thứ hai, tức hai S3Client cho cùng một bucket.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      KycSubmission,
      KycDocument,
      KycDocumentView,
      // SuperAdminGuard đọc admin_users để lấy admin_role; guard dựng trong
      // context module này nên repository phải khai ở đây.
      AdminUser,
      AuthEntity,
    ]),
    SecurityModule,
    // Guard được dựng trong context của module khai controller, không dùng lại
    // instance của AdminModule — nên phải import trực tiếp.
    IpWhitelistModule,
    QueueModule,
  ],
  controllers: [KycController, KycAdminController],
  providers: [KycService, SuperAdminGuard],
  exports: [KycService],
})
export class KycModule {}
