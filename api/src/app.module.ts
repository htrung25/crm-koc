import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import type { RedisClientType } from 'redis';
import { DatabaseModule } from './infra/database.module';
import { RedisModule, REDIS_CLIENT } from './infra/redis.module';
import { SecurityModule } from './security/security.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AdminMaintenanceInterceptor } from './common/interceptors/admin-maintenance.interceptor';
import { AppThrottlerGuard } from './security/throttler.guard';
import { RedisThrottlerStorage } from './security/throttler-redis.storage';
import { BrandModule } from './module/brand/brand.module';
import { CollaborationModule } from './module/collaboration/collaboration.module';
import { CreatorModule } from './module/creator/creator.module';
import { KycModule } from './module/kyc/kyc.module';
import { AdminModule } from './module/admin/admin.module';
import { AuthModule } from './module/auth/auth.module';
import { IpWhitelistModule } from './module/admin/ip-whitelist.module';
import { HealthModule } from './module/health/health.module';

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
    HealthModule,
    // KycModule phải đứng trước AuthModule để tránh /admin/:id
    // của AdminController nuốt route /admin/kyc và gây lỗi UUID 400.
    KycModule,
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
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminMaintenanceInterceptor,
    },
  ],
})
export class AppModule {}
