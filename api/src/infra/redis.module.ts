import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
// import type: isolatedModules + emitDecoratorMetadata cấm dùng type thường
// trong chữ ký constructor đã decorate
import type { RedisClientType } from 'redis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/** Prefix key tập trung một chỗ để tránh gõ nhầm rải rác trong code. */
export const redisKeys = {
  /** Token đã đăng xuất. TTL = thời gian còn lại của token. */
  blacklist: (jti: string) => `bl:jti:${jti}`,
  /** Cache account cho JwtStrategy. Xoá key này khi account đổi trạng thái. */
  account: (id: string) => `account:${id}`,
  /** Idempotency-Key của POST tạo campaign -> id đã tạo */
  campaignIdempotency: (brandId: string, key: string) =>
    `campaign:idem:${brandId}:${key}`,
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<RedisClientType> => {
        const logger = new Logger('Redis');
        const client: RedisClientType = createClient({
          socket: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: Number(config.get('REDIS_PORT', 6379)),
          },
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          database: Number(config.get('REDIS_DB', 0)),
        });

        // node-redis ném unhandled error nếu không có listener 'error'
        client.on('error', (err: Error) =>
          logger.error(`Redis error: ${err.message}`),
        );

        await client.connect();
        logger.log('Redis connected');

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClientType) {}

  // socket vẫn mở sau khi app đóng => process không thoát nếu không quit
  async onModuleDestroy() {
    await this.client.quit();
  }
}
