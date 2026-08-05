import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import { AdminUser } from './entities/admin_user.entity';
import { SuperAdminGuard } from './super-admin.guard';
import { AuthEntity } from '../auth/entities/auth.entity';
import { SecurityModule } from '../../security/security.module';
import { IpWhitelistModule } from './ip-whitelist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser, AuthEntity]),
    SecurityModule,
    IpWhitelistModule,
  ],
  controllers: [AdminController, AdminProfileController],
  providers: [AdminService, AdminProfileService, SuperAdminGuard],
  exports: [AdminService, AdminProfileService],
})
export class AdminModule {}
