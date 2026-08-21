import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import type { RedisClientType } from 'redis';
import { DatabaseModule } from './infra/database.module';
import { RedisModule, REDIS_CLIENT } from './infra/redis.module';
import { SecurityModule } from './security/security.module';
import { AppThrottlerGuard } from './security/throttler.guard';
import { RedisThrottlerStorage } from './security/throttler-redis.storage';
import { BrandModule } from './module/brand/brand.module';
import { CollaborationModule } from './module/collaboration/collaboration.module';
import { CreatorModule } from './module/creator/creator.module';
import { AdminModule } from './module/admin/admin.module';
import { AuthModule } from './module/auth/auth.module';
import { IpWhitelistModule } from './module/admin/ip-whitelist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    SecurityModule,
    // forRootAsync để lấy được REDIS_CLIENT (RedisModule là @Global nên
    // không cần khai imports ở đây).
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: RedisClientType) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    AuthModule,
    AdminModule,
    BrandModule,
    CreatorModule,
    CollaborationModule,
    IpWhitelistModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
