import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthEntity } from './entities/auth.entity';
import { LocalStrategy } from '../../passport/local.strategy';
import { JwtStrategy } from '../../passport/jwt.strategy';
import { AdminModule } from '../admin/admin.module';
import { SecurityModule } from 'src/security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthEntity]),
    AdminModule,
    PassportModule,
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
