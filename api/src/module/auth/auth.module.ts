import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity } from './entities/auth.entity';
import { LocalStrategy } from '../../passport/local.strategy';
import { JwtStrategy } from '../../passport/jwt.strategy';
import { AdminModule } from '../admin/admin.module';
import { BrandModule } from '../brand/brand.module';
import { CreatorModule } from '../creator/creator.module';
import { IpWhitelistModule } from '../admin/ip-whitelist.module';
import { SecurityModule } from '../../security/security.module';
import { OtpService } from '../../security/otp.service';
import { SessionGuard } from '../../security/session.guard';
import { EmailService } from '../../common/services/email.service';
import { RedisCacheService } from '../../common/services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthEntity]),
    AdminModule,
    BrandModule,
    CreatorModule,
    PassportModule,
    SecurityModule,
    IpWhitelistModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    OtpService,
    EmailService,
    RedisCacheService,
    // Đặt ở đây chứ không ở SecurityModule: guard cần AuthService, mà
    // AuthModule đã import SecurityModule — khai ngược lại sẽ thành vòng tròn.
    SessionGuard,
  ],
  // export để module khác dùng lại đúng instance này, không tự khai lại
  exports: [
    AuthService,
    OtpService,
    EmailService,
    RedisCacheService,
    SessionGuard,
  ],
})
export class AuthModule {}
