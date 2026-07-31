import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity } from './entities/auth.entity';
import { LocalStrategy } from '../../passport/local.strategy';
import { JwtStrategy } from '../../passport/jwt.strategy';
import { AdminModule } from '../admin/admin.module';
import { SecurityModule } from '../../security/security.module';
import { OtpService } from '../../security/otp.service';
import { EmailService } from '../../common/services/email.service';
import { RedisCacheService } from '../../common/services/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthEntity]),
    AdminModule,
    PassportModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    OtpService,
    EmailService,
    RedisCacheService,
  ],
  // export để module khác dùng lại đúng instance này, không tự khai lại
  exports: [AuthService, OtpService, EmailService, RedisCacheService],
})
export class AuthModule {}
