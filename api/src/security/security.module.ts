import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtModule } from '@nestjs/jwt';
import { AccountCacheService } from './account-cache.service';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'your-secret-key-change-in-production',
        ),
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
  providers: [AccountCacheService, TokenBlacklistService],
  exports: [AccountCacheService, TokenBlacklistService, JwtModule],
})
export class SecurityModule {}
