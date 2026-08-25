import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin-user.service';
import { AdminController } from './admin-user.controller';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import { BrandListController } from './brand-list.controller';
import { BrandListService } from './brand-list.service';
import { CreatorListController } from './creator-list.controller';
import { CreatorListService } from './creator-list.service';
import { AdminUser } from './entities/admin-user.entity';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { SystemConfigurationService } from './system-configuration.service';
import { SystemConfigurationController } from './system-configuration.controller';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthEntity } from '../auth/entities/auth.entity';
import { SecurityModule } from '../../security/security.module';
import { IpWhitelistModule } from './ip-whitelist.module';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AuthEntity,
      SystemConfiguration,
      AuditLog,
    ]),
    SecurityModule,
    IpWhitelistModule,
  ],
  // THỨ TỰ QUAN TRỌNG: Nest đăng ký route theo đúng thứ tự mảng này, Express
  // khớp cái trúng đầu tiên. AdminController có '/admin/:id' nên sẽ nuốt cả
  // '/admin/brands-list' lẫn '/admin/creators-list' nếu đứng trước — request
  // rơi vào findOne rồi ParseUUIDPipe ném 400. Giữ AdminController ở CUỐI.
  controllers: [
    AdminProfileController,
    BrandListController,
    CreatorListController,
    SystemConfigurationController,
    AuditLogController,
    AdminController,
  ],
  providers: [
    AdminService,
    AdminProfileService,
    BrandListService,
    CreatorListService,
    SuperAdminGuard,
    SystemConfigurationService,
    AuditLogService,
  ],
  // SystemConfigurationService export ra ngoài cho AdminMaintenanceInterceptor.
  exports: [
    AdminService,
    AdminProfileService,
    SystemConfigurationService,
    AuditLogService,
  ],
})
export class AdminModule {}
