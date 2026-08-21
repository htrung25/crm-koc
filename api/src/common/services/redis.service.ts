import { Inject, Injectable, Logger } from '@nestjs/common';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {}

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      this.logger.error(`Redis GET failed, key=${key}`, error);
      return null;
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds?: number,
  ): Promise<boolean> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        ttlSeconds ? { EX: ttlSeconds } : undefined,
      );
      return true;
    } catch (error) {
      this.logger.error(`Redis SET failed, key=${key}`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Redis DEL failed, key=${key}`, error);
      return false;
    }
  }

  async getOrLoad<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }
    const data = await loader();
    await this.setJson(key, data, ttlSeconds);
    return data;
  }

  // async rotate(sessionID: string, oldJti: string, newJti: string) {
  //   try {
  //     return await this.redisRotate(sessionID, oldJti, newJti);
  //   } catch (e) {
  //     if (!this.isConnErr(e)) throw e;
  //     this.logger.warn('Redis down -> rotate over to Postgres ');
  //   }
  //   const { rowCount } = await this.db.query(
  //     `UPDATE sessions SET current_jti = $1
  //     WHERE id = $2 AND current_jti = $3 AND revoked_at IS NULL AND expires_at > now()`,
  //     [newJti, sessionId, oldJti],
  //   );
  //   if (rowCount === 0) {
  //     // jti không khớp = token cũ bị dùng lại → thu hồi cả chuỗi
  //     await this.db.query(
  //       `UPDATE sessions SET revoked_at = now() WHERE id = $1`,
  //       [sessionId],
  //     );
  //     throw new UnauthorizedException('Token reuse detected');
  //   }
  // }
}
