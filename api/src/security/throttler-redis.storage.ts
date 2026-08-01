import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { RedisClientType } from 'redis';
import { REDIS_CLIENT } from '../infra/redis.module';

const HIT_PREFIX = 'throttle';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `${HIT_PREFIX}:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:block`;

    // Đang bị chặn thì trả về ngay, KHÔNG tăng bộ đếm: nếu tăng tiếp thì mỗi
    // request bị chặn lại gia hạn thêm thời gian chặn.
    const blockTtlMs = await this.redis.pTTL(blockKey);
    if (blockTtlMs > 0) {
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockTtlMs / 1000),
      };
    }

    // INCR nguyên tử: nhiều instance cùng tăng vẫn ra đúng một con số
    const totalHits = await this.redis.incr(hitKey);

    // Chỉ đặt hạn ở lần đầu. Đặt lại mỗi lần sẽ thành cửa sổ trượt vô hạn và
    // bộ đếm không bao giờ được reset.
    if (totalHits === 1) {
      await this.redis.pExpire(hitKey, ttl);
    }

    let ttlMs = await this.redis.pTTL(hitKey);
    // -1 = key còn nhưng mất hạn (lỡ rơi mất EXPIRE): vá lại để khỏi kẹt vĩnh viễn
    if (ttlMs < 0) {
      await this.redis.pExpire(hitKey, ttl);
      ttlMs = ttl;
    }

    const isBlocked = totalHits > limit;
    let timeToBlockExpire = 0;

    if (isBlocked) {
      // Không khai blockDuration thì throttler truyền 0 => phạt bằng đúng ttl
      const blockMs = blockDuration > 0 ? blockDuration : ttl;
      await this.redis.set(blockKey, '1', { PX: blockMs });
      timeToBlockExpire = Math.ceil(blockMs / 1000);
    }

    return {
      totalHits,
      timeToExpire: Math.ceil(ttlMs / 1000),
      isBlocked,
      timeToBlockExpire,
    };
  }
}
