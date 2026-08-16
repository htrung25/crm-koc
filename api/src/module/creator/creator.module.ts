import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { CreatorProfileService } from './creator-profile.service';
import { CreatorProfileController } from './creator-profile.controller';
import { SecurityModule } from '../../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreatorProfile, AuthEntity]),
    SecurityModule,
  ],
  controllers: [CreatorProfileController],
  providers: [CreatorProfileService],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [CreatorProfileService],
})
export class CreatorModule {}
