import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AdminUser } from './entities/admin_user.entity';
import { BrandProfile } from '../brand/entities/brand-profile.entity';
import { CreatorProfile } from '../creator/entities/creator-profile.entity';
import { AuthEntity } from '../auth/entities/auth.entity';
import { SecurityModule } from '../../security/security.module';
import { IpWhitelistModule } from './ip-whitelist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      BrandProfile,
      CreatorProfile,
      AuthEntity,
    ]),
    SecurityModule,
    IpWhitelistModule,
  ],
  controllers: [AdminController, ProfileController],
  providers: [AdminService, ProfileService],
  exports: [AdminService, ProfileService],
})
export class AdminModule {}
