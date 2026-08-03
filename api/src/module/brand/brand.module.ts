import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthEntity } from '../auth/entities/auth.entity';
import { BrandProfile } from './entities/brand-profile.entity';
import { BrandProfileService } from './brand-profile.service';
import { BrandProfileController } from './brand-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandProfile, AuthEntity])],
  controllers: [BrandProfileController],
  providers: [BrandProfileService],
  // export để AuthService tạo hồ sơ lúc đăng ký mà không tự khai lại repository
  exports: [BrandProfileService],
})
export class BrandModule {}
