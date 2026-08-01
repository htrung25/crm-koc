import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileEntity } from './entities/profile.entity';
import { AuthEntity } from '../auth/entities/auth.entity';
import { SecurityModule } from '../../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileEntity, AuthEntity]),
    SecurityModule,
  ],
  controllers: [AdminController, ProfileController],
  providers: [AdminService, ProfileService],
  exports: [AdminService, ProfileService],
})
export class AdminModule {}
