import { Inject, Injectable } from '@nestjs/common';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT, redisKeys } from '../infra/redis.module';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async revoke(jti: string, expUnixSeconds: number): Promise<boolean> {
    const ttl = expUnixSeconds - Math.floor(Date.now() / 1000);
    if (ttl <= 0) {
      return false;
    }
    // node-redis: option dạng object { EX: seconds }
    await this.redis.set(redisKeys.blacklist(jti), '1', { EX: ttl });
    return true;
  }

  async isRevoked(jti: string): Promise<boolean> {
    return (await this.redis.exists(redisKeys.blacklist(jti))) === 1;
  }
}
