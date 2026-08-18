import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';
import { SecurityModule } from '../../security/security.module';
import { Collaboration } from './entities/collaboration.entity';
import { CollaborationService } from './collaboration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrandProfile, AuthEntity, Collaboration]),
    SecurityModule,
  ],
  controllers: [BrandProfileController],
  providers: [BrandProfileService, CollaborationService],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [BrandProfileService, CollaborationService],
})
export class BrandModule {}
