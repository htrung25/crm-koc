import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEvent } from '../module/auth/entities/session-event.entity';
import { SessionEventService } from './session-event.service';
import { SessionService } from './session.service';
import { JwtAuthService } from './jwt-auth.service';
import { AccountCacheService } from './account-cache.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { StorageService } from '../common/services/storage.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEvent]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // getOrThrow: thiếu biến thì app chết lúc khởi động thay vì ký bằng
        // một chuỗi mặc định ai cũng đoán được.
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRES_IN',
            '15m',
          ) as StringValue | number,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AccountCacheService,
    TokenBlacklistService,
    SessionEventService,
    SessionService,
    JwtAuthService,
    StorageService,
  ],
  exports: [
    AccountCacheService,
    TokenBlacklistService,
    SessionEventService,
    SessionService,
    JwtAuthService,
    JwtModule,
    StorageService,
  ],
})
export class SecurityModule {}
