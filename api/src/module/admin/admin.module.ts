import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Profile } from './entities/profile.entity';
import { AuthEntity } from '../auth/entities/auth.entity';
import { SecurityModule } from '../../security/security.module';
import { IpWhitelistModule } from './ip-whitelist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, AuthEntity]),
    SecurityModule,
    IpWhitelistModule,
  ],
  controllers: [AdminController, ProfileController],
  providers: [AdminService, ProfileService],
  exports: [AdminService, ProfileService],
})
export class AdminModule {}
